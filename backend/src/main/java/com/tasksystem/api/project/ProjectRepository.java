package com.tasksystem.api.project;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    boolean existsByShortNameIgnoreCase(String shortName);
}
