package com.example.backend.e2.service;

class MissingSchedulingSetupException extends IllegalStateException {
    MissingSchedulingSetupException(String message) {
        super(message);
    }
}
