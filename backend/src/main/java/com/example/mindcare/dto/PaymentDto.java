package com.example.mindcare.dto;
import lombok.Data;
@Data
public class PaymentDto {
    private Long sessionId;
    private String paymentMethodId;
    private Long amount;
}
