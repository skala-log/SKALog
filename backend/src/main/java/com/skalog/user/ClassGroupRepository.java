package com.skalog.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassGroupRepository extends JpaRepository<ClassGroup, Long> {
    Optional<ClassGroup> findByCampusAndName(String campus, String name);
}
