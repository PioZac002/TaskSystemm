package com.tasksystem.api.issue;

import com.tasksystem.api.file.FileService;
import com.tasksystem.api.file.dto.FileDto;
import com.tasksystem.api.issue.activity.ActivityDto;
import com.tasksystem.api.issue.dto.CreateIssueRequest;
import com.tasksystem.api.issue.dto.IssueDto;
import com.tasksystem.api.issue.dto.IssueFieldRequests;
import com.tasksystem.api.issue.dto.UpdateIssueRequest;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Tag(name = "Issues", description = "Issues: creation, updates, status and assignment changes.")
@RestController
@RequestMapping("/api/v1/issue")
public class IssueController {

    private final IssueService issueService;
    private final FileService fileService;

    public IssueController(IssueService issueService, FileService fileService) {
        this.issueService = issueService;
        this.fileService = fileService;
    }

    @GetMapping("/all")
    public List<IssueDto> getAll() {
        return issueService.findAll();
    }

    @GetMapping("/id/{id}")
    public IssueDto getById(@PathVariable Long id) {
        return issueService.findById(id);
    }

    @GetMapping("/key/{key}")
    public IssueDto getByKey(@PathVariable String key) {
        return issueService.findByKey(key);
    }

    @GetMapping("/project/{projectId}")
    public List<IssueDto> getByProject(@PathVariable Long projectId) {
        return issueService.findByProject(projectId);
    }

    @GetMapping("/user/{userId}")
    public List<IssueDto> getByUser(@PathVariable Long userId) {
        return issueService.findByAssignee(userId);
    }

    @GetMapping("/{issueId}/activities")
    public List<ActivityDto> getActivities(@PathVariable Long issueId) {
        return issueService.findActivities(issueId);
    }

    @PostMapping("/create")
    public ResponseEntity<IssueDto> create(@Valid @RequestBody CreateIssueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(issueService.create(request));
    }

    @PostMapping("/{issueId}/attachments")
    public ResponseEntity<FileDto> addAttachment(@PathVariable Long issueId,
                                                 @RequestPart("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fileService.storeForIssue(file, issueId));
    }

    @PutMapping("/update")
    public IssueDto update(@Valid @RequestBody UpdateIssueRequest request) {
        return issueService.update(request);
    }

    @PutMapping("/assign")
    public IssueDto assign(@Valid @RequestBody IssueFieldRequests.Assign request) {
        return issueService.assign(request.issueId(), request.effectiveAssigneeId());
    }

    @PutMapping("/rename")
    public IssueDto rename(@Valid @RequestBody IssueFieldRequests.Rename request) {
        return issueService.rename(request.issueId(), request.title());
    }

    @PutMapping("/assign-team")
    public IssueDto assignTeam(@Valid @RequestBody IssueFieldRequests.AssignTeam request) {
        return issueService.assignTeam(request.issueId(), request.teamId());
    }

    @PutMapping("/update-status")
    public IssueDto updateStatus(@Valid @RequestBody IssueFieldRequests.UpdateStatus request) {
        return issueService.updateStatus(request.issueId(), request.status());
    }

    @PutMapping("/update-priority")
    public IssueDto updatePriority(@Valid @RequestBody IssueFieldRequests.UpdatePriority request) {
        return issueService.updatePriority(request.issueId(), request.priority());
    }

    @PutMapping("/update-due-date")
    public IssueDto updateDueDate(@Valid @RequestBody IssueFieldRequests.UpdateDueDate request) {
        return issueService.updateDueDate(request.issueId(), request.dueDate());
    }

    @DeleteMapping("/all")
    public ResponseEntity<Void> deleteAll() {
        issueService.deleteAll();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        issueService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
