document.addEventListener('DOMContentLoaded', function () {
    const therapySelect = document.getElementById('therapyTypeSelect');
    const sessionTypeSelect = document.getElementById('sessionTypeSelect');
    const dateInput = document.getElementById('sessionDate');
    const timeInput = document.getElementById('sessionTime');
    const therapistSelect = document.getElementById('therapistSelect');

    const summaryTherapy = document.getElementById('summaryTherapy');
    const summarySessionType = document.getElementById('summarySessionType');
    const summaryDate = document.getElementById('summaryDate');
    const summaryTime = document.getElementById('summaryTime');
    const summaryTherapist = document.getElementById('summaryTherapist');

    const liveTherapyText = document.getElementById('liveTherapyText');
    const liveTypeText = document.getElementById('liveTypeText');

    function formatTherapy(value) {
        if (!value) return 'Not selected yet';
        return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    }

    function formatSessionType(value) {
        if (!value) return 'Not selected yet';
        return value === 'IN_PERSON' ? 'In Person' : value.charAt(0) + value.slice(1).toLowerCase();
    }

    function formatDate(value) {
        if (!value) return 'Choose a date';
        const date = new Date(value + 'T00:00:00');
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function formatTime(value) {
        if (!value) return 'Choose a time';
        const [hours, minutes] = value.split(':');
        const date = new Date();
        date.setHours(hours, minutes);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    function updatePreview() {
        const therapyText = formatTherapy(therapySelect?.value || '');
        const typeText = formatSessionType(sessionTypeSelect?.value || '');
        const dateText = formatDate(dateInput?.value || '');
        const timeText = formatTime(timeInput?.value || '');
        const therapistText = therapistSelect?.selectedOptions?.[0]?.textContent?.trim() || 'Select therapist';

        if (summaryTherapy) summaryTherapy.textContent = therapyText;
        if (summarySessionType) summarySessionType.textContent = typeText;
        if (summaryDate) summaryDate.textContent = dateText;
        if (summaryTime) summaryTime.textContent = timeText;
        if (summaryTherapist) summaryTherapist.textContent = therapistText;

        if (liveTherapyText) liveTherapyText.textContent = therapyText === 'Not selected yet' ? 'Select therapy' : therapyText;
        if (liveTypeText) liveTypeText.textContent = typeText === 'Not selected yet' ? 'Select session type' : typeText;
    }

    [therapySelect, sessionTypeSelect, dateInput, timeInput, therapistSelect].forEach(el => {
        if (el) {
          el.addEventListener('input', updatePreview);
          el.addEventListener('change', updatePreview);
        }
    });

    updatePreview();
});
