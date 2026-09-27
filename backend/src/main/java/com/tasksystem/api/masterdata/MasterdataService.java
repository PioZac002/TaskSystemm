package com.tasksystem.api.masterdata;

import com.tasksystem.api.common.error.ApiException;
import com.tasksystem.api.masterdata.dto.MasterdataValueDto;
import com.tasksystem.api.masterdata.dto.MasterdataValueRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class MasterdataService {

    private final MasterdataValueRepository repository;

    public MasterdataService(MasterdataValueRepository repository) {
        this.repository = repository;
    }

    public List<MasterdataValueDto> findAllActive() {
        return repository.findAllByActiveTrueOrderByTypeAscSortOrderAsc().stream()
                .map(MasterdataValueDto::from)
                .toList();
    }

    public List<MasterdataValueDto> findByType(String type) {
        return repository.findAllByTypeIgnoreCaseAndActiveTrueOrderBySortOrderAsc(type).stream()
                .map(MasterdataValueDto::from)
                .toList();
    }

    @Transactional
    public Optional<MasterdataValueDto> upsert(MasterdataValueRequest request) {
        if (request.type() == null || request.type().isBlank()) {
            throw ApiException.badRequest("Masterdata type is required");
        }
        String value = request.value() != null && !request.value().isBlank() ? request.value().trim() : null;
        String code = request.code() != null && !request.code().isBlank()
                ? request.code().trim()
                : (value != null ? value.toUpperCase(Locale.ROOT).replaceAll("\\s+", "_") : null);
        if (code == null) {
            throw ApiException.badRequest("Masterdata code or value is required");
        }

        MasterdataValue entity = repository
                .findByTypeIgnoreCaseAndCodeIgnoreCase(request.type().trim(), code)
                .orElse(null);

        boolean delete = Boolean.TRUE.equals(request.delete());
        if (delete) {
            if (entity != null) {
                entity.setActive(false);
            }
            return Optional.empty();
        }

        if (entity == null) {
            entity = repository.save(new MasterdataValue(
                    request.type().trim(),
                    code,
                    value != null ? value : code,
                    request.order() != null ? request.order() : 0,
                    null
            ));
        } else {
            if (value != null) {
                entity.setValue(value);
            }
            if (request.order() != null) {
                entity.setSortOrder(request.order());
            }
        }
        entity.setActive(request.isActive() == null || request.isActive());
        return Optional.of(MasterdataValueDto.from(entity));
    }

    /**
     * Finds or (re)creates an active value; used when issue labels are assigned.
     */
    @Transactional
    public MasterdataValue resolveOrCreate(String type, String code, String value, int order) {
        return repository.findByTypeIgnoreCaseAndCodeIgnoreCase(type, code)
                .map(existing -> {
                    existing.setActive(true);
                    return existing;
                })
                .orElseGet(() -> repository.save(new MasterdataValue(type, code, value, order, null)));
    }
}
