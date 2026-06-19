package com.example.mindcare.validation;

import java.util.regex.Pattern;

public class PasswordStrengthValidator {

    private static final Pattern PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[A-Z])(?=.*\\d)(?=.*[@#$!]).{8,}$");

    public static boolean isStrong(String password){
        return PASSWORD_PATTERN.matcher(password).matches();
    }
}