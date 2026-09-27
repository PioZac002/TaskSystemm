package com.tasksystem.api.masterdata;

import com.tasksystem.api.masterdata.dto.MasterdataValueDto;
import com.tasksystem.api.masterdata.dto.MasterdataValueRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Masterdata", description = "Configurable dictionaries (statuses, priorities, types).")
@RestController
@RequestMapping("/api/v1/masterdata")
public class MasterdataController {

    private final MasterdataService masterdataService;

    public MasterdataController(MasterdataService masterdataService) {
        this.masterdataService = masterdataService;
    }

    @GetMapping
    public List<MasterdataValueDto> getAll() {
        return masterdataService.findAllActive();
    }

    @GetMapping("/type")
    public List<MasterdataValueDto> getByType(@RequestParam String type) {
        return masterdataService.findByType(type);
    }

    @PostMapping
    public ResponseEntity<MasterdataValueDto> upsert(@RequestBody MasterdataValueRequest request) {
        return masterdataService.upsert(request)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
