package com.example.mindcare.service.impl;

import com.example.mindcare.Enum.TherapyType;
import com.example.mindcare.dto.AiSurveyAnswerItemDto;
import com.example.mindcare.dto.AiSurveyStepDto;
import com.example.mindcare.dto.AiTherapyRecommendationDto;
import com.example.mindcare.dto.SurveyFormDto;
import com.example.mindcare.service.AiTherapyAdvisorService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;

@Slf4j
@Service
public class AiTherapyAdvisorServiceImpl implements AiTherapyAdvisorService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.api.model:gemini-3.5-flash}")
    private String geminiModel;

    @Value("${gemini.api.url:https://generativelanguage.googleapis.com/v1beta/models/}")
    private String geminiApiUrl;

    private static final List<String> CANDIDATE_MODELS = List.of(
            "gemini-3.5-flash",
            "gemini-3.7-flash",
            "gemini-flash-latest",
            "gemini-3.8-flash",
            "gemini-3.1-flash-lite"
    );

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AiTherapyAdvisorServiceImpl(ObjectMapper objectMapper) {
        this.restClient = RestClient.builder().build();
        this.objectMapper = objectMapper;
    }

    @Override
    public AiSurveyStepDto startInteractiveAssessment() {
        return AiSurveyStepDto.builder()
                .questionNumber(1)
                .totalEstimated(7)
                .question("To help me understand your needs and match you with the ideal therapy approach, what is currently your primary reason for seeking support?")
                .contextSnippet("Let's begin your personalized psychological intake check-in.")
                .options(List.of(
                        "Overwhelming anxiety, chronic worry, or panic spikes",
                        "Low mood, loss of motivation, or feeling hopeless",
                        "Burnout, severe work/life stress, or life transitions",
                        "Chronic sleep problems, insomnia, or nighttime restlessness",
                        "ADHD symptoms, difficulty focusing, or task procrastination",
                        "Relationship strain, family conflict, or emotional loneliness"
                ))
                .allowsFreeText(true)
                .isCompleted(false)
                .build();
    }

    @Override
    public AiSurveyStepDto processNextStep(List<AiSurveyAnswerItemDto> history) {
        if (history == null || history.isEmpty()) {
            return startInteractiveAssessment();
        }

        int answeredCount = history.size();
        int nextQuestionNumber = answeredCount + 1;

        // Try Gemini AI first if key is present
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty() && !geminiApiKey.startsWith("your_")) {
            try {
                AiSurveyStepDto aiStep = callGeminiInteractiveAssessment(history);
                if (aiStep != null) {
                    log.info("Gemini interactive step {} generated (completed: {})", aiStep.getQuestionNumber(), aiStep.isCompleted());
                    return aiStep;
                }
            } catch (Exception e) {
                log.warn("Gemini interactive assessment failed: {}. Falling back to clinical decision tree.", e.getMessage(), e);
            }
        }

        // Fallback branching clinical intake
        return fallbackInteractiveStep(history, nextQuestionNumber);
    }

    private AiSurveyStepDto callGeminiInteractiveAssessment(List<AiSurveyAnswerItemDto> history) throws Exception {
        int count = history.size();
        int nextNum = count + 1;
        boolean forceComplete = count >= 10;
        boolean canComplete = count >= 5;

        StringBuilder conversationContext = new StringBuilder();
        for (int i = 0; i < history.size(); i++) {
            AiSurveyAnswerItemDto item = history.get(i);
            conversationContext.append("Q").append(i + 1).append(": ").append(item.getQuestion()).append("\n");
            conversationContext.append("User Answer: ").append(item.getAnswer()).append("\n\n");
        }

        String prompt = """
            You are an empathetic, licensed AI Clinical Psychologist and Triage Specialist conducting an adaptive psychological intake assessment for MindCare.
            
            Assessment Progress:
            - Questions answered so far: %d
            - Minimum questions before concluding: 5
            - Maximum questions allowed: 10
            - Can conclude now? %s
            - Force conclude now? %s
            
            Conversation History:
            %s
            
            Allowed therapy modalities:
            ["CBT", "ACT", "DBT", "TRAUMA_FOCUSED", "COUPLES_FAMILY", "SLEEP_CBT_I", "ADHD_COACHING", "GENERAL_COUNSELLING"]
            
            Decision Protocol:
            1. If questions answered < 5: You MUST ask the next adaptive clinical diagnostic question tailored directly to their previous response (e.g. asking about triggers, physical symptoms, duration, daily dysfunction, sleep, coping style, support network). Provide 4-5 diverse, realistic choice chips + allow free text.
            2. If questions answered >= 5 AND you have gathered sufficient clinical signal to pinpoint the exact optimal therapy modality: Set "isCompleted": true and provide the comprehensive "finalRecommendation".
            3. If questions answered between 5 and 9 AND key clinical information is still ambiguous: Ask a targeted clarifying question to distinguish between candidate therapies (e.g. CBT vs ACT vs DBT).
            4. If questions answered >= 10: You MUST set "isCompleted": true and provide the "finalRecommendation".
            
            Return a JSON object conforming strictly to this schema:
            {
              "isCompleted": boolean,
              "questionNumber": %d,
              "totalEstimated": 7,
              "contextSnippet": "Empathetic 1-sentence reflection on user's previous answer (or empty if completed)",
              "question": "The next clinical diagnostic question (or empty if completed)",
              "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
              "allowsFreeText": true,
              "finalRecommendation": {
                 "category": "e.g. 'Anxiety & Emotional Regulation' or 'Mood & Value Realignment'",
                 "recommendedTherapy": "ONE OF THE ALLOWED ENUM VALUES",
                 "aiAnalysis": "Compassionate, 3-4 sentence personalized clinical rationale explicitly connecting their answers across the questions to why this specific therapy modality and therapist specialty will help.",
                 "actionPlan": [
                   "Personalized immediate self-care step 1",
                   "Personalized immediate self-care step 2",
                   "Personalized immediate self-care step 3"
                 ],
                 "stressScore": integer (0 to 100 representing calculated emotional distress),
                 "crisisFlag": boolean
              }
            }
            """.formatted(
                count,
                canComplete ? "YES" : "NO",
                forceComplete ? "YES" : "NO",
                conversationContext.toString(),
                nextNum
        );

        String responseJson = executeGeminiWithFailover(prompt);
        if (responseJson == null || responseJson.isBlank()) {
            return null;
        }

        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode candidates = root.path("candidates");
        if (candidates.isEmpty()) return null;

        String rawText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        rawText = cleanJsonString(rawText);
        JsonNode resultNode = objectMapper.readTree(rawText);

        boolean isCompleted = resultNode.path("isCompleted").asBoolean(false) || forceComplete;

        if (isCompleted && resultNode.has("finalRecommendation") && !resultNode.path("finalRecommendation").isNull()) {
            JsonNode recNode = resultNode.path("finalRecommendation");
            String category = recNode.path("category").asText("Personalized Mental Wellbeing");
            String therapyStr = recNode.path("recommendedTherapy").asText("GENERAL_COUNSELLING");
            String aiAnalysis = recNode.path("aiAnalysis").asText("");
            int stressScore = recNode.path("stressScore").asInt(70);
            boolean crisisFlag = recNode.path("crisisFlag").asBoolean(false);

            List<String> actionPlan = new ArrayList<>();
            if (recNode.has("actionPlan") && recNode.get("actionPlan").isArray()) {
                for (JsonNode item : recNode.get("actionPlan")) {
                    actionPlan.add(item.asText());
                }
            }
            if (actionPlan.isEmpty()) {
                actionPlan = defaultActionPlan(category);
            }

            TherapyType therapyType = parseTherapyType(therapyStr);

            AiTherapyRecommendationDto recDto = AiTherapyRecommendationDto.builder()
                    .category(category)
                    .recommendedTherapy(therapyType)
                    .aiAnalysis(aiAnalysis)
                    .actionPlan(actionPlan)
                    .stressScore(stressScore)
                    .crisisFlag(crisisFlag)
                    .build();

            return AiSurveyStepDto.builder()
                    .questionNumber(count)
                    .totalEstimated(count)
                    .isCompleted(true)
                    .finalRecommendation(recDto)
                    .build();
        }

        // Ongoing next question
        String question = resultNode.path("question").asText();
        if (question == null || question.isBlank()) {
            return null;
        }

        String contextSnippet = resultNode.path("contextSnippet").asText("Thank you for sharing that with me.");
        List<String> options = new ArrayList<>();
        if (resultNode.has("options") && resultNode.get("options").isArray()) {
            for (JsonNode opt : resultNode.get("options")) {
                options.add(opt.asText());
            }
        }
        if (options.isEmpty()) {
            options = List.of("Mild / Manageable", "Moderate / Interfering occasionally", "Severe / Impacting daily life daily", "Overwhelming / Crisis level");
        }

        return AiSurveyStepDto.builder()
                .questionNumber(nextNum)
                .totalEstimated(Math.max(nextNum + 1, 7))
                .question(question)
                .contextSnippet(contextSnippet)
                .options(options)
                .allowsFreeText(true)
                .isCompleted(false)
                .build();
    }

    private String executeGeminiWithFailover(String prompt) {
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentPart = Map.of("parts", List.of(textPart));
        Map<String, Object> generationConfig = Map.of(
                "response_mime_type", "application/json",
                "temperature", 0.3
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(contentPart),
                "generationConfig", generationConfig
        );

        List<String> modelOrder = new ArrayList<>();
        if (geminiModel != null && !geminiModel.isBlank() && !modelOrder.contains(geminiModel)) {
            modelOrder.add(geminiModel.trim());
        }
        for (String m : CANDIDATE_MODELS) {
            if (!modelOrder.contains(m)) {
                modelOrder.add(m);
            }
        }

        for (String modelName : modelOrder) {
            try {
                String targetUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + geminiApiKey.trim();
                log.debug("Invoking Gemini with model: {}", modelName);
                String responseJson = restClient.post()
                        .uri(targetUrl)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(requestBody)
                        .retrieve()
                        .body(String.class);

                if (responseJson != null && !responseJson.isBlank() && responseJson.contains("candidates")) {
                    log.info("Successfully received Gemini response using model: {}", modelName);
                    return responseJson;
                }
            } catch (Exception e) {
                log.warn("Gemini call failed on model {}: {}", modelName, e.getMessage());
            }
        }
        return null;
    }

    private String cleanJsonString(String raw) {
        if (raw == null) return "{}";
        String trimmed = raw.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    private AiSurveyStepDto fallbackInteractiveStep(List<AiSurveyAnswerItemDto> history, int nextNum) {
        // Collect all text from history to determine themes
        String combined = history.stream().map(AiSurveyAnswerItemDto::getAnswer).reduce("", (a, b) -> a + " " + b).toLowerCase();

        boolean mentionsAnxiety = combined.contains("anxiety") || combined.contains("worry") || combined.contains("panic");
        boolean mentionsMood = combined.contains("mood") || combined.contains("hopeless") || combined.contains("depress");
        boolean mentionsSleep = combined.contains("sleep") || combined.contains("insomnia") || combined.contains("fatigue");
        boolean mentionsAdhd = combined.contains("focus") || combined.contains("adhd") || combined.contains("procrastin");
        boolean mentionsStress = combined.contains("stress") || combined.contains("burnout");

        if (nextNum == 2) {
            return AiSurveyStepDto.builder()
                    .questionNumber(2)
                    .totalEstimated(6)
                    .contextSnippet("Thank you for opening up about that.")
                    .question("How long have you been experiencing these feelings or symptoms?")
                    .options(List.of(
                            "Less than 2 weeks (recently started)",
                            "1 to 6 months (ongoing concern)",
                            "6 months to over a year (chronic challenge)",
                            "Fluctuating on and off for several years"
                    ))
                    .allowsFreeText(true)
                    .isCompleted(false)
                    .build();
        } else if (nextNum == 3) {
            return AiSurveyStepDto.builder()
                    .questionNumber(3)
                    .totalEstimated(6)
                    .contextSnippet("Understanding the timeline helps identify whether acute or long-term coping tools are needed.")
                    .question("How significantly is this affecting your day-to-day routine, work, or relationships?")
                    .options(List.of(
                            "Mildly — I can function normally but feel drained",
                            "Moderately — I struggle with work deadlines or socializing",
                            "Severely — I often cancel plans or miss responsibilities",
                            "Completely debilitating — It is very hard to get through the day"
                    ))
                    .allowsFreeText(true)
                    .isCompleted(false)
                    .build();
        } else if (nextNum == 4) {
            return AiSurveyStepDto.builder()
                    .questionNumber(4)
                    .totalEstimated(6)
                    .contextSnippet("Noticing daily impacts is a vital step toward reclaiming your balance.")
                    .question("How would you describe your sleep patterns and physical energy levels recently?")
                    .options(List.of(
                            "Sleep is fine, but my mental energy is depleted",
                            "Trouble falling asleep due to racing thoughts",
                            "Frequent night awakenings and waking up unrefreshed",
                            "Sleeping too much / struggling to get out of bed"
                    ))
                    .allowsFreeText(true)
                    .isCompleted(false)
                    .build();
        } else if (nextNum == 5) {
            return AiSurveyStepDto.builder()
                    .questionNumber(5)
                    .totalEstimated(6)
                    .contextSnippet("Sleep and physical energy strongly shape emotional resilience.")
                    .question("What kind of therapeutic approach or therapist support resonates most with you?")
                    .options(List.of(
                            "Practical, structured tools and thought reframing (CBT)",
                            "Acceptance, mindfulness, and finding deeper personal meaning (ACT)",
                            "Emotional regulation, coping skills, and crisis stabilization (DBT)",
                            "Exploring past experiences and root causes (Psychodynamic / Trauma)",
                            "Open, non-judgmental guidance to talk things through"
                    ))
                    .allowsFreeText(true)
                    .isCompleted(false)
                    .build();
        } else {
            // Conclude on step 6
            TherapyType therapy = TherapyType.GENERAL_COUNSELLING;
            String category = "General Wellbeing & Mindful Balance";
            String rationale;

            if (mentionsAnxiety) {
                therapy = TherapyType.CBT;
                category = "Anxiety & Cognitive Restructuring";
                rationale = "Based on your reported patterns of worrying and intrusive stress, Cognitive Behavioural Therapy (CBT) will equip you with concrete, evidence-based tools to rewire automatic negative thoughts and lower physical anxiety.";
            } else if (mentionsMood) {
                therapy = TherapyType.ACT;
                category = "Mood Elevation & Value Alignment";
                rationale = "Your responses reflect feelings of emotional heaviness and lack of motivation. Acceptance and Commitment Therapy (ACT) helps you navigate difficult feelings while building intentional daily actions aligned with your core values.";
            } else if (mentionsSleep) {
                therapy = TherapyType.SLEEP_CBT_I;
                category = "Sleep & Circadian Restoration";
                rationale = "Disrupted sleep conditioning and nighttime racing thoughts are primary drivers of your fatigue. CBT for Insomnia (CBT-I) re-establishes healthy circadian sleep pressure and bedtime calmness.";
            } else if (mentionsAdhd) {
                therapy = TherapyType.ADHD_COACHING;
                category = "Executive Function & ADHD Support";
                rationale = "You noted difficulties with task initiation, focus, and avoidance. ADHD & Executive Function Coaching provides structured accountability, environmental adjustments, and anti-procrastination frameworks.";
            } else {
                therapy = TherapyType.CBT;
                category = "Emotional Resilience & Coping Skills";
                rationale = "Your intake responses indicate situational stress and emotional fatigue. Structured counselling and cognitive coping strategies will give you clarity and supportive guidance.";
            }

            AiTherapyRecommendationDto rec = AiTherapyRecommendationDto.builder()
                    .category(category)
                    .recommendedTherapy(therapy)
                    .aiAnalysis(rationale)
                    .actionPlan(defaultActionPlan(category))
                    .stressScore(mentionsAnxiety || mentionsMood ? 78 : 65)
                    .crisisFlag(false)
                    .build();

            return AiSurveyStepDto.builder()
                    .questionNumber(nextNum)
                    .totalEstimated(nextNum)
                    .isCompleted(true)
                    .finalRecommendation(rec)
                    .build();
        }
    }

    @Override
    public AiTherapyRecommendationDto analyzeSurveyAndRecommend(SurveyFormDto form) {
        int q9 = form != null ? form.getQ9() : 0;
        int q10 = form != null ? form.getQ10() : 0;
        boolean crisis = q9 >= 2 || q10 >= 5;

        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty() && !geminiApiKey.startsWith("your_")) {
            try {
                AiTherapyRecommendationDto aiResult = callGeminiLegacyApi(form, crisis);
                if (aiResult != null && aiResult.getRecommendedTherapy() != null) {
                    return aiResult;
                }
            } catch (Exception e) {
                log.warn("Gemini AI legacy recommendation failed: {}", e.getMessage());
            }
        }

        return fallbackRuleEngine(form, crisis);
    }

    private AiTherapyRecommendationDto callGeminiLegacyApi(SurveyFormDto form, boolean crisis) throws Exception {
        String prompt = """
            You are a clinical AI triage specialist. Analyze these check-in ratings (1=low, 5=high):
            Q1 (Anxiety): %d, Q2 (Low Mood): %d, Q3 (Sleep): %d, Q4 (Focus): %d, Q5 (Overwhelm): %d,
            Q6 (Support): %d, Q7 (Avoidance): %d, Q8 (Stress): %d, Q9 (Safety): %d, Q10 (Urgency): %d.
            Crisis: %s.
            Allowed therapies: ["CBT", "ACT", "DBT", "TRAUMA_FOCUSED", "COUPLES_FAMILY", "SLEEP_CBT_I", "ADHD_COACHING", "GENERAL_COUNSELLING"]
            Return JSON:
            {
              "category": "String",
              "recommendedTherapy": "ONE OF ALLOWED ENUMS",
              "aiAnalysis": "2-3 sentences clinical explanation",
              "actionPlan": ["Step 1", "Step 2", "Step 3"],
              "stressScore": 75,
              "crisisFlag": false
            }
            """.formatted(
                n(form.getQ1()), n(form.getQ2()), n(form.getQ3()), n(form.getQ4()), n(form.getQ5()),
                n(form.getQ6()), n(form.getQ7()), n(form.getQ8()), n(form.getQ9()), n(form.getQ10()),
                crisis ? "YES" : "NO"
        );

        String responseJson = executeGeminiWithFailover(prompt);
        if (responseJson == null || responseJson.isBlank()) return null;

        JsonNode root = objectMapper.readTree(responseJson);
        JsonNode candidates = root.path("candidates");
        if (candidates.isEmpty()) return null;

        String aiOutputText = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
        aiOutputText = cleanJsonString(aiOutputText);
        JsonNode resultNode = objectMapper.readTree(aiOutputText);

        String category = resultNode.path("category").asText("General Wellbeing");
        String therapyStr = resultNode.path("recommendedTherapy").asText("GENERAL_COUNSELLING");
        String aiAnalysis = resultNode.path("aiAnalysis").asText("");
        int stressScore = resultNode.path("stressScore").asInt(70);
        boolean aiCrisisFlag = resultNode.path("crisisFlag").asBoolean(crisis);

        List<String> actionPlan = new ArrayList<>();
        if (resultNode.has("actionPlan") && resultNode.get("actionPlan").isArray()) {
            for (JsonNode actionItem : resultNode.get("actionPlan")) {
                actionPlan.add(actionItem.asText());
            }
        }
        if (actionPlan.isEmpty()) actionPlan = defaultActionPlan(category);

        return AiTherapyRecommendationDto.builder()
                .category(category)
                .recommendedTherapy(parseTherapyType(therapyStr))
                .aiAnalysis(aiAnalysis)
                .actionPlan(actionPlan)
                .stressScore(stressScore)
                .crisisFlag(crisis || aiCrisisFlag)
                .build();
    }

    private TherapyType parseTherapyType(String raw) {
        if (raw == null) return TherapyType.GENERAL_COUNSELLING;
        String clean = raw.toUpperCase().trim();
        for (TherapyType type : TherapyType.values()) {
            if (clean.equals(type.name()) || clean.contains(type.name())) {
                return type;
            }
        }
        if (clean.contains("COGNITIVE")) return TherapyType.CBT;
        if (clean.contains("DIALECTICAL")) return TherapyType.DBT;
        if (clean.contains("ACCEPTANCE")) return TherapyType.ACT;
        if (clean.contains("TRAUMA")) return TherapyType.TRAUMA_FOCUSED;
        if (clean.contains("SLEEP")) return TherapyType.SLEEP_CBT_I;
        if (clean.contains("ADHD")) return TherapyType.ADHD_COACHING;
        if (clean.contains("COUPLES") || clean.contains("FAMILY")) return TherapyType.COUPLES_FAMILY;
        return TherapyType.GENERAL_COUNSELLING;
    }

    private AiTherapyRecommendationDto fallbackRuleEngine(SurveyFormDto form, boolean crisis) {
        int q1 = n(form.getQ1()), q2 = n(form.getQ2()), q3 = n(form.getQ3()), q4 = n(form.getQ4()), q5 = n(form.getQ5());
        int q6 = n(form.getQ6()), q7 = n(form.getQ7()), q8 = n(form.getQ8()), q9 = n(form.getQ9()), q10 = n(form.getQ10());

        int total = q1 + q2 + q3 + q4 + q5 + q6 + q7 + q8 + q9 + q10;
        int stressScore = Math.min(100, (int) Math.round((total / 50.0) * 100));

        TherapyType therapy;
        String category;
        String analysis;

        if (crisis) {
            therapy = TherapyType.DBT;
            category = "Intensive Emotional Support & Regulation";
            analysis = "Your responses indicate high distress and urgent need for structured stabilization. Dialectical Behaviour Therapy (DBT) provides distress tolerance techniques and immediate safety planning.";
        } else if (q1 + q5 + q8 >= 8) {
            therapy = TherapyType.CBT;
            category = "Anxiety & Worry Management";
            analysis = "Based on your reported heightened anxiety and stress reactions, Cognitive Behavioural Therapy (CBT) will help restructure automatic worrying cycles into proactive coping mechanisms.";
        } else if (q2 + q7 >= 6) {
            therapy = TherapyType.ACT;
            category = "Low Mood & Value Alignment";
            analysis = "Your responses highlight feelings of low mood and disconnection. Acceptance and Commitment Therapy (ACT) helps overcome avoidance and realign daily routines with core personal values.";
        } else if (q3 >= 4) {
            therapy = TherapyType.SLEEP_CBT_I;
            category = "Sleep & Circadian Restoration";
            analysis = "Sleep disruption appears to be a primary contributor to your daily fatigue. CBT for Insomnia (CBT-I) restores healthy sleep conditioning and circadian rhythm.";
        } else if (q4 >= 4) {
            therapy = TherapyType.ADHD_COACHING;
            category = "Focus & Executive Function Support";
            analysis = "You reported difficulties with daytime focus and task avoidance. Structured coaching and behavioral strategies can help manage overwhelm and streamline daily productivity.";
        } else {
            therapy = TherapyType.GENERAL_COUNSELLING;
            category = "General Wellbeing & Personal Growth";
            analysis = "Your responses show general life stress that can benefit from supportive counselling, active listening, and guided self-exploration.";
        }

        return AiTherapyRecommendationDto.builder()
                .category(category)
                .recommendedTherapy(therapy)
                .aiAnalysis(analysis)
                .actionPlan(defaultActionPlan(category))
                .stressScore(stressScore)
                .crisisFlag(crisis)
                .build();
    }

    private List<String> defaultActionPlan(String category) {
        if (category.contains("Anxiety")) {
            return List.of(
                    "Practice 4-7-8 diaphragmatic breathing for 5 minutes during stress spikes.",
                    "Keep a daily thought-record log to identify repetitive worry triggers.",
                    "Engage in 15 minutes of light aerobic walking to discharge physical tension."
            );
        } else if (category.contains("Mood") || category.contains("Value")) {
            return List.of(
                    "Schedule one micro-activity each morning that aligns with your personal values.",
                    "Practice self-compassion journaling rather than harsh self-evaluation.",
                    "Reach out to one trusted friend or support group member this week."
            );
        } else if (category.contains("Sleep")) {
            return List.of(
                    "Maintain a strictly consistent wake-up time 7 days a week.",
                    "Disconnect from bright screens and mobile notifications 45 minutes before bed.",
                    "Keep the bedroom dark, cool, and dedicated solely to rest."
            );
        }
        return List.of(
                "Dedicate 10 minutes to mindfulness or calm quiet reflection each morning.",
                "Set clear boundaries around work hours to prevent daily burnout.",
                "Take advantage of your MindCare therapist sessions for tailored guidance."
        );
    }

    private int n(Integer v) {
        if (v == null) return 3;
        return Math.max(1, Math.min(v, 5));
    }
}
