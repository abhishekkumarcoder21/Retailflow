package com.retailflow.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private final boolean success = false;
    private final String error;
    private final String message;
    private final int status;
    private final String path;
    private final LocalDateTime timestamp;
    private final String correlationId;
    private final Map<String, String> validationErrors;
    private final List<String> details;
}
