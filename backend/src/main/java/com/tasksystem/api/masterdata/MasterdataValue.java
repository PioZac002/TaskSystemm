package com.tasksystem.api.masterdata;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Generic dictionary value (e.g. issue labels with type {@code ISSUE_LABEL}).
 */
@Entity
@Table(
        name = "masterdata_values",
        uniqueConstraints = @UniqueConstraint(columnNames = {"type", "code"})
)
public class MasterdataValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String code;

    @Column(name = "value_text", nullable = false)
    private String value;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    private String color;

    @Column(nullable = false)
    private boolean active = true;

    protected MasterdataValue() {
    }

    public MasterdataValue(String type, String code, String value, int sortOrder, String color) {
        this.type = type;
        this.code = code;
        this.value = value;
        this.sortOrder = sortOrder;
        this.color = color;
    }

    public Long getId() {
        return id;
    }

    public String getType() {
        return type;
    }

    public String getCode() {
        return code;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
