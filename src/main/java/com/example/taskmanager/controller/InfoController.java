package com.example.taskmanager.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/info")
public class InfoController {

    public record AppInfo(String name, String version, String javaVersion) {}

    @GetMapping
    public AppInfo info() {
        return new AppInfo("Task Manager API", "1.0.0", System.getProperty("java.version"));
    }
}
