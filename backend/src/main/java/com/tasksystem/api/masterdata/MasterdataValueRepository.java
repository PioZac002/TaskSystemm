package com.tasksystem.api.masterdata;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MasterdataValueRepository extends JpaRepository<MasterdataValue, Long> {

    List<MasterdataValue> findAllByActiveTrueOrderByTypeAscSortOrderAsc();

    List<MasterdataValue> findAllByTypeIgnoreCaseAndActiveTrueOrderBySortOrderAsc(String type);

    Optional<MasterdataValue> findByTypeIgnoreCaseAndCodeIgnoreCase(String type, String code);
}
