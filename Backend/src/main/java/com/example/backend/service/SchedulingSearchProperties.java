package com.example.backend.service;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "scheduling.search")
public class SchedulingSearchProperties {

    private long maximumSearchNodes = 100_000;
    private long maximumDurationMillis = 10_000;
    private long maximumCandidateAssignments = 500_000;
    private long maximumGeneratedCandidates = 1_000_000;

    public long getMaximumSearchNodes() {
        return maximumSearchNodes;
    }

    public void setMaximumSearchNodes(long maximumSearchNodes) {
        this.maximumSearchNodes = maximumSearchNodes;
    }

    public long getMaximumDurationMillis() {
        return maximumDurationMillis;
    }

    public void setMaximumDurationMillis(long maximumDurationMillis) {
        this.maximumDurationMillis = maximumDurationMillis;
    }

    public long getMaximumCandidateAssignments() {
        return maximumCandidateAssignments;
    }

    public void setMaximumCandidateAssignments(long maximumCandidateAssignments) {
        this.maximumCandidateAssignments = maximumCandidateAssignments;
    }

    public long getMaximumGeneratedCandidates() {
        return maximumGeneratedCandidates;
    }

    public void setMaximumGeneratedCandidates(long maximumGeneratedCandidates) {
        this.maximumGeneratedCandidates = maximumGeneratedCandidates;
    }
}
