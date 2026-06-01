package com.example.taskmanager.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.taskmanager.domain.TaskPriority;
import com.example.taskmanager.domain.TaskStatus;
import com.example.taskmanager.dto.CreateTaskRequest;
import com.example.taskmanager.dto.StatusUpdateRequest;
import com.example.taskmanager.dto.TaskResponse;
import com.example.taskmanager.dto.UpdateTaskRequest;
import com.example.taskmanager.exception.GlobalExceptionHandler;
import com.example.taskmanager.exception.TaskNotFoundException;
import com.example.taskmanager.service.TaskService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(TaskController.class)
@Import(GlobalExceptionHandler.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TaskService taskService;

    private ObjectMapper objectMapper;

    private TaskResponse sampleResponse() {
        return new TaskResponse(
                1L,
                "Test Task",
                "Some description",
                TaskStatus.TODO,
                TaskPriority.MEDIUM,
                null,
                LocalDateTime.now(),
                LocalDateTime.now(),
                Set.of());
    }

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
    }

    @Test
    void createTask_validRequest_returns201WithLocation() throws Exception {
        when(taskService.createTask(any(CreateTaskRequest.class))).thenReturn(sampleResponse());

        mockMvc.perform(
                        post("/tasks")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"title":"Test Task","priority":"MEDIUM"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", org.hamcrest.Matchers.containsString("/tasks/1")))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Test Task"));
    }

    @Test
    void createTask_missingTitle_returns400() throws Exception {
        mockMvc.perform(
                        post("/tasks")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"description":"no title here"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void getAllTasks_noFilter_returns200WithList() throws Exception {
        when(taskService.getAllTasks(null, null)).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Test Task"));
    }

    @Test
    void getAllTasks_withStatusFilter_passesParamToService() throws Exception {
        when(taskService.getAllTasks(TaskStatus.TODO, null)).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/tasks").param("status", "TODO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    void getAllTasks_withPriorityFilter_passesParamToService() throws Exception {
        when(taskService.getAllTasks(null, TaskPriority.HIGH)).thenReturn(List.of());

        mockMvc.perform(get("/tasks").param("priority", "HIGH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void getTaskById_found_returns200() throws Exception {
        when(taskService.getTaskById(1L)).thenReturn(sampleResponse());

        mockMvc.perform(get("/tasks/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void getTaskById_notFound_returns404() throws Exception {
        when(taskService.getTaskById(99L)).thenThrow(new TaskNotFoundException(99L));

        mockMvc.perform(get("/tasks/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("99")));
    }

    @Test
    void updateTask_validRequest_returns200() throws Exception {
        TaskResponse updated = new TaskResponse(
                1L,
                "Updated",
                null,
                TaskStatus.IN_PROGRESS,
                TaskPriority.HIGH,
                null,
                LocalDateTime.now(),
                LocalDateTime.now(),
                Set.of());
        when(taskService.updateTask(eq(1L), any(UpdateTaskRequest.class))).thenReturn(updated);

        mockMvc.perform(
                        patch("/tasks/1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"status":"IN_PROGRESS","priority":"HIGH"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    void deleteTask_exists_returns204() throws Exception {
        doNothing().when(taskService).deleteTask(1L);

        mockMvc.perform(delete("/tasks/1")).andExpect(status().isNoContent());
    }

    @Test
    void deleteTask_notFound_returns404() throws Exception {
        doThrow(new TaskNotFoundException(99L)).when(taskService).deleteTask(99L);

        mockMvc.perform(delete("/tasks/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void addTag_validRequest_returns200WithTag() throws Exception {
        TaskResponse withTag = new TaskResponse(
                1L,
                "Test Task",
                null,
                TaskStatus.TODO,
                TaskPriority.MEDIUM,
                null,
                LocalDateTime.now(),
                LocalDateTime.now(),
                Set.of("urgent"));
        when(taskService.addTag(1L, "urgent")).thenReturn(withTag);

        mockMvc.perform(
                        post("/tasks/1/tags")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"tag":"urgent"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tags[0]").value("urgent"));
    }

    @Test
    void addTag_emptyTag_returns400() throws Exception {
        mockMvc.perform(post("/tasks/1/tags")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"tag":""}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void removeTag_exists_returns200() throws Exception {
        when(taskService.removeTag(1L, "urgent")).thenReturn(sampleResponse());

        mockMvc.perform(delete("/tasks/1/tags/urgent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));
    }

    @Test
    void removeTag_taskNotFound_returns404() throws Exception {
        when(taskService.removeTag(99L, "urgent")).thenThrow(new TaskNotFoundException(99L));

        mockMvc.perform(delete("/tasks/99/tags/urgent")).andExpect(status().isNotFound());
    }

    @Test
    void replaceTask_validRequest_returns200() throws Exception {
        TaskResponse replaced = new TaskResponse(
                1L,
                "Replaced",
                "new desc",
                TaskStatus.TODO,
                TaskPriority.URGENT,
                null,
                LocalDateTime.now(),
                LocalDateTime.now(),
                Set.of());
        when(taskService.replaceTask(eq(1L), any(CreateTaskRequest.class))).thenReturn(replaced);

        mockMvc.perform(
                        put("/tasks/1")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"title":"Replaced","priority":"URGENT"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Replaced"))
                .andExpect(jsonPath("$.priority").value("URGENT"));
    }

    @Test
    void replaceTask_notFound_returns404() throws Exception {
        when(taskService.replaceTask(eq(99L), any(CreateTaskRequest.class))).thenThrow(new TaskNotFoundException(99L));

        mockMvc.perform(
                        put("/tasks/99")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"title":"X","priority":"LOW"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateTaskStatus_validStatus_returns200() throws Exception {
        TaskResponse updated = new TaskResponse(
                1L,
                "Task",
                null,
                TaskStatus.CANCELLED,
                TaskPriority.MEDIUM,
                null,
                LocalDateTime.now(),
                LocalDateTime.now(),
                Set.of());
        when(taskService.updateTaskStatus(eq(1L), any(StatusUpdateRequest.class)))
                .thenReturn(updated);

        mockMvc.perform(
                        patch("/tasks/1/status")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(
                                        """
                                {"status":"CANCELLED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void updateTaskStatus_missingStatus_returns400() throws Exception {
        mockMvc.perform(patch("/tasks/1/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }
}
