// ====================================================================
// STUDY SYNC AI - MAIN CONTROLLER
// ====================================================================

const db = window.supabaseClient || null;

document.addEventListener("DOMContentLoaded", function () {
  initThemeToggle();
  initModals();
  initProfile();
  initAiCoach();
  initResources();

  if (document.getElementById("assignmentsList")) {
    loadAssignments();
  }

  if (document.getElementById("examsList")) {
    loadExams();
  }

  if (document.getElementById("customResourcesList")) {
    loadResources();
  }
});

// ====================================================================
// THEME
// ====================================================================

function initThemeToggle() {
  const button = document.getElementById("themeToggle");

  if (!button) {
    return;
  }

  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-theme");
    button.innerHTML = '<i class="fa-solid fa-sun"></i> Light Mode';
  }

  button.addEventListener("click", function () {
    document.body.classList.toggle("dark-theme");

    const darkModeEnabled = document.body.classList.contains("dark-theme");

    localStorage.setItem(
      "darkMode",
      darkModeEnabled ? "enabled" : "disabled"
    );

    button.innerHTML = darkModeEnabled
      ? '<i class="fa-solid fa-sun"></i> Light Mode'
      : '<i class="fa-solid fa-moon"></i> Dark Mode';
  });
}

// ====================================================================
// MODALS, ASSIGNMENTS AND EXAMS
// ====================================================================

function initModals() {
  const assignmentModal = document.getElementById("assignmentModal");
  const examModal = document.getElementById("examModal");

  function openModal(modal) {
    if (modal) {
      modal.classList.add("open");
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.classList.remove("open");
    }
  }

  // Main page buttons
  const assignmentAddButton = document.getElementById("assignmentAddButton");
  const examAddButton = document.getElementById("examAddButton");

  if (assignmentAddButton) {
    assignmentAddButton.addEventListener("click", function () {
      openModal(assignmentModal);
    });
  }

  if (examAddButton) {
    examAddButton.addEventListener("click", function () {
      openModal(examModal);
    });
  }

  // Header buttons in the current HTML are links. This prevents reload.
  const assignmentHeaderButton = document.querySelector(
    ".nav-actions a.btn-primary[href='assignments.html']"
  );

  const examHeaderButton = document.querySelector(
    ".nav-actions a.btn-primary[href='exams.html']"
  );

  if (assignmentHeaderButton) {
    assignmentHeaderButton.addEventListener("click", function (event) {
      event.preventDefault();
      openModal(assignmentModal);
    });
  }

  if (examHeaderButton) {
    examHeaderButton.addEventListener("click", function (event) {
      event.preventDefault();
      openModal(examModal);
    });
  }

  const assignmentCancel = document.getElementById("assignmentCancel");
  const examCancel = document.getElementById("examCancel");

  if (assignmentCancel) {
    assignmentCancel.addEventListener("click", function () {
      closeModal(assignmentModal);
    });
  }

  if (examCancel) {
    examCancel.addEventListener("click", function () {
      closeModal(examModal);
    });
  }

  // Close when the dark background is clicked.
  if (assignmentModal) {
    assignmentModal.addEventListener("click", function (event) {
      if (event.target === assignmentModal) {
        closeModal(assignmentModal);
      }
    });
  }

  if (examModal) {
    examModal.addEventListener("click", function (event) {
      if (event.target === examModal) {
        closeModal(examModal);
      }
    });
  }

  // Close with Escape.
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal(assignmentModal);
      closeModal(examModal);
    }
  });

  const assignmentForm = document.getElementById("assignmentForm");

  if (assignmentForm) {
    assignmentForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const formData = new FormData(assignmentForm);

      const assignment = {
        title: formData.get("title"),
        subject: formData.get("subject"),
        due_date: formData.get("dueDate"),
        priority: formData.get("priority"),
        difficulty: String(formData.get("difficulty") || "").split("★").length - 1,
        estimated_time: formData.get("estimatedTime"),
        progress: Number(formData.get("progress")) || 0,
        status: formData.get("status")
      };

      try {
        if (db) {
          const result = await db
            .from("assignments")
            .insert([assignment]);

          if (result.error) {
            throw result.error;
          }
        } else {
          const assignments = getLocalData("studysync_assignments");
          assignments.push(assignment);
          saveLocalData("studysync_assignments", assignments);
        }

        assignmentForm.reset();
        closeModal(assignmentModal);
        loadAssignments();
      } catch (error) {
        console.error(error);
        alert("Could not save assignment: " + error.message);
      }
    });
  }

  const examForm = document.getElementById("examForm");

  if (examForm) {
    examForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const formData = new FormData(examForm);

      const exam = {
        subject: formData.get("subject"),
        exam_date: formData.get("examDate"),
        difficulty: String(formData.get("difficulty") || "").split("★").length - 1,
        confidence: Number(formData.get("confidence")) || 60,
        revision_hours: Number(formData.get("hours")) || 10,
        notes: formData.get("notes"),
        topics: formData.get("topics")
      };

      try {
        if (db) {
          const result = await db.from("exams").insert([exam]);

          if (result.error) {
            throw result.error;
          }
        } else {
          const exams = getLocalData("studysync_exams");
          exams.push(exam);
          saveLocalData("studysync_exams", exams);
        }

        examForm.reset();
        closeModal(examModal);
        loadExams();
      } catch (error) {
        console.error(error);
        alert("Could not save exam: " + error.message);
      }
    });
  }
}

// ====================================================================
// ASSIGNMENTS
// ====================================================================

async function loadAssignments() {
  const container = document.getElementById("assignmentsList");

  if (!container) {
    return;
  }

  try {
    let assignments = [];

    if (db) {
      const result = await db
        .from("assignments")
        .select("*")
        .order("due_date", { ascending: true });

      if (result.error) {
        throw result.error;
      }

      assignments = result.data || [];
    } else {
      assignments = getLocalData("studysync_assignments");

      assignments.sort(function (first, second) {
        return String(first.due_date).localeCompare(String(second.due_date));
      });
    }

    container.innerHTML = "";

    if (assignments.length === 0) {
      container.innerHTML =
        '<p class="task-meta" style="grid-column: 1 / -1; text-align: center; padding: 20px;">No assignments yet. Click Add to create one.</p>';
      return;
    }

    assignments.forEach(function (task) {
      const card = document.createElement("article");
      card.className = "card panel card-lift";

      card.innerHTML =
        '<div class="panel-title">' +
        "<h3>" + escapeHtml(task.title) + "</h3>" +
        '<span class="tag ' +
        (task.priority === "High" ? "tag-red" : "tag-blue") +
        '">' +
        escapeHtml(task.priority) +
        " Priority</span>" +
        "</div>" +
        "<h4>" + escapeHtml(task.subject) + "</h4>" +
        '<p class="assignment-meta">Due: ' +
        escapeHtml(task.due_date) +
        " • Difficulty: " +
        escapeHtml(formatDifficulty(task.difficulty)) +
        " • Est. Time: " +
        escapeHtml(task.estimated_time) +
        "</p>" +
        '<div class="progress-track" style="margin: 12px 0;">' +
        '<div class="progress-fill" style="width: ' +
        Math.max(0, Math.min(100, Number(task.progress) || 0)) +
        '%;"></div>' +
        "</div>" +
        '<div class="section-heading">' +
        '<span class="task-meta">Progress ' +
        (Number(task.progress) || 0) +
        '%</span>' +
        '<span class="tag">' +
        escapeHtml(task.status) +
        "</span>" +
        "</div>";

      container.appendChild(card);
    });
  } catch (error) {
    console.error(error);

    container.innerHTML =
      '<p class="task-meta">Could not load assignments. Check your Supabase settings.</p>';
  }
}

// ====================================================================
// EXAMS
// ====================================================================

async function loadExams() {
  const container = document.getElementById("examsList");

  if (!container) {
    return;
  }

  try {
    let exams = [];

    if (db) {
      const result = await db
        .from("exams")
        .select("*")
        .order("exam_date", { ascending: true });

      if (result.error) {
        throw result.error;
      }

      exams = result.data || [];
    } else {
      exams = getLocalData("studysync_exams");

      exams.sort(function (first, second) {
        return String(first.exam_date).localeCompare(String(second.exam_date));
      });
    }

    container.innerHTML = "";

    if (exams.length === 0) {
      container.innerHTML =
        '<p class="task-meta" style="grid-column: 1 / -1; text-align: center; padding: 20px;">No exams yet. Click Add Exam to create one.</p>';
      return;
    }

    exams.forEach(function (exam) {
      const card = document.createElement("article");
      card.className = "card panel card-lift";

      card.innerHTML =
        '<div class="panel-title">' +
        "<h3>" + escapeHtml(exam.subject) + " Exam</h3>" +
        '<span class="tag tag-orange">Confidence: ' +
        (Number(exam.confidence) || 0) +
        "%</span>" +
        "</div>" +
        '<p class="assignment-meta">Date: ' +
        escapeHtml(exam.exam_date) +
        " • Rev Hours: " +
        (Number(exam.revision_hours) || 0) +
        "h • Difficulty: " +
        escapeHtml(formatDifficulty(exam.difficulty)) +
        "</p>" +
        '<div class="small-text" style="margin: 10px 0;"><strong>Topics:</strong> ' +
        escapeHtml(exam.topics) +
        "</div>" +
        '<p class="task-meta"><em>' +
        escapeHtml(exam.notes) +
        "</em></p>";

      container.appendChild(card);
    });
  } catch (error) {
    console.error(error);

    container.innerHTML =
      '<p class="task-meta">Could not load exams. Check your Supabase settings.</p>';
  }
}

// ====================================================================
// RESOURCES
// ====================================================================

function initResources() {
  const resourceForm = document.getElementById("resourceForm");

  if (!resourceForm) {
    return;
  }

  resourceForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = resourceForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton ? submitButton.textContent : "";
    const formData = new FormData(resourceForm);
    const selectedFile = formData.get("resourceFile");

    const resource = {
      title: String(formData.get("resourceTitle") || "").trim(),
      subject: String(formData.get("resourceSubject") || "").trim(),
      notes: String(formData.get("resourceNotes") || "").trim(),
      file_url:
        selectedFile instanceof File && selectedFile.name
          ? selectedFile.name
          : null
    };

    if (!resource.title) {
      alert("Please enter a resource title.");
      return;
    }

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Saving...";
      }

      if (db) {
        const result = await db.from("resources").insert([resource]);

        if (result.error) {
          throw result.error;
        }
      } else {
        const resources = getLocalData("studysync_resources");
        resources.unshift({
          ...resource,
          created_at: new Date().toISOString()
        });
        saveLocalData("studysync_resources", resources);
      }

      resourceForm.reset();
      await loadResources();
      alert("Resource added successfully.");
    } catch (error) {
      console.error("Could not save resource:", error);
      alert("Could not save resource: " + error.message);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText || "Add Resource";
      }
    }
  });
}

async function loadResources() {
  const container = document.getElementById("customResourcesList");

  if (!container) {
    return;
  }

  try {
    let resources = [];

    if (db) {
      const result = await db
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (result.error) {
        throw result.error;
      }

      resources = result.data || [];
    } else {
      resources = getLocalData("studysync_resources");
    }

    container.innerHTML = "";

    if (resources.length === 0) {
      container.innerHTML =
        '<p class="task-meta" style="grid-column: 1 / -1; text-align: center; padding: 20px;">No resources added yet.</p>';
      return;
    }

    resources.forEach(function (resource) {
      const card = document.createElement("article");
      card.className = "resource-card card-lift";

      const notesText = resource.notes || "No notes provided.";
      const fileText = resource.file_url
        ? '<p class="small-text" style="margin-top:10px;"><strong>File:</strong> ' +
          escapeHtml(resource.file_url) +
          "</p>"
        : "";

      card.innerHTML =
        '<div class="panel-title">' +
        "<h3>" + escapeHtml(resource.title) + "</h3>" +
        '<span class="tag tag-blue">' +
        escapeHtml(resource.subject || "Notes") +
        "</span>" +
        "</div>" +
        '<p class="resource-meta">' +
        escapeHtml(notesText) +
        "</p>" +
        fileText;

      container.appendChild(card);
    });
  } catch (error) {
    console.error("Could not load resources:", error);
    container.innerHTML =
      '<p class="task-meta" style="grid-column: 1 / -1; text-align: center; padding: 20px;">Could not load resources from Supabase.</p>';
  }
}

// ====================================================================
// PROFILE AND AI COACH
// ====================================================================

function initProfile() {
  const saveButton = document.getElementById("saveProfileBtn");

  document.querySelectorAll(".toggle").forEach(function (toggle) {
    toggle.addEventListener("click", function () {
      toggle.classList.toggle("active");
    });
  });

  if (saveButton) {
    saveButton.addEventListener("click", function () {
      alert("Profile settings saved locally.");
    });
  }
}

function initAiCoach() {
  const chatWindow = document.querySelector(".chat-window");
  const chatInput = document.getElementById("chatInput");
  const sendButton = document.getElementById("sendPrompt");
  const resetButton = document.getElementById("resetCoach");

  if (!chatWindow || !chatInput) {
    return;
  }

  function addMessage(text, isUser) {
    const bubble = document.createElement("div");
    bubble.className = isUser ? "chat-bubble user" : "chat-bubble";
    bubble.textContent = text;
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function sendMessage() {
    const message = chatInput.value.trim();

    if (!message) {
      return;
    }

    addMessage(message, true);
    chatInput.value = "";

    setTimeout(function () {
      addMessage(
        "I can help you organise your study plan. Start with your highest-priority task.",
        false
      );
    }, 500);
  }

  if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
  }

  chatInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      sendMessage();
    }
  });

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      chatWindow.innerHTML =
        '<div class="chat-bubble">Hello! How can I help with your study plan?</div>';
    });
  }
}

// ====================================================================
// HELPERS
// ====================================================================

function getLocalData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch (error) {
    return [];
  }
}

function saveLocalData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function createId() {
  return Date.now().toString() + Math.random().toString(16).slice(2);
}

function formatDifficulty(value) {
  const number = Math.max(1, Math.min(5, Number(value) || 1));
  return "★".repeat(number) + "☆".repeat(5 - number);
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}