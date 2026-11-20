package com.example.backend.e3.dto;

import java.math.BigDecimal;

public record StandingsRow(
        int position, Long teamId, String team, int played, int won, int lost,
        int tied, int noResult, BigDecimal points, BigDecimal netRunRate) {
}
