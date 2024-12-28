import React, { useState, useEffect } from "react";
import {
  Button,
  Container,
  Text,
  Title,
  Modal,
  TextInput,
  Group,
  Card,
  ActionIcon,
  Select,
} from "@mantine/core";
import { MoonStars, Sun, Trash, Edit } from "tabler-icons-react";
import { MantineProvider, ColorSchemeProvider } from "@mantine/core";
import { useHotkeys, useLocalStorage } from "@mantine/hooks";
// If you have @mantine/dates installed, you can import DatePicker
// import { DatePicker } from "@mantine/dates";

export default function MyTaskApp() {
  // --------------------- THEME HANDLING ---------------------
  const [themeMode, setThemeMode] = useLocalStorage({
    key: "mantine-color-scheme",
    defaultValue: "light",
    getInitialValueInEffect: true,
  });

  const switchThemeMode = (value) =>
    setThemeMode(value || (themeMode === "dark" ? "light" : "dark"));

  useHotkeys([["mod+J", () => switchThemeMode()]]);

  // --------------------- TASKS: RETRIEVE & STORE ---------------------
  const [taskList, setTaskList] = useState([]);

  useEffect(() => {
    retrieveTasksFromStorage();
  }, []);

  function retrieveTasksFromStorage() {
    const storedData = localStorage.getItem("tasks");
    if (storedData) {
      setTaskList(JSON.parse(storedData));
    }
  }

  function persistTasks(updatedTasks) {
    localStorage.setItem("tasks", JSON.stringify(updatedTasks));
  }

  // --------------------- MODAL FOR ADDING NEW TASK ---------------------
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  // Fields for new task creation
  const [titleInput, setTitleInput] = useState("");
  const [summaryInput, setSummaryInput] = useState("");
  const [stateInput, setStateInput] = useState("Not done");
  const [deadlineInput, setDeadlineInput] = useState("");

  // Add a new task to the list
  function addNewTask() {
    const freshTask = {
      title: titleInput,
      summary: summaryInput,
      state: stateInput,
      deadline: deadlineInput,
    };

    setTaskList((prevTasks) => {
      const newArray = [...prevTasks, freshTask];
      persistTasks(newArray);
      return newArray;
    });

    // Reset input fields but keep modal open for consecutive additions
    setTitleInput("");
    setSummaryInput("");
    setStateInput("Not done");
    setDeadlineInput("");
  }

  // --------------------- MODAL FOR EDITING TASK ---------------------
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentEditIndex, setCurrentEditIndex] = useState(null);

  // Fields for editing
  const [editTitleInput, setEditTitleInput] = useState("");
  const [editSummaryInput, setEditSummaryInput] = useState("");
  const [editStateInput, setEditStateInput] = useState("Not done");
  const [editDeadlineInput, setEditDeadlineInput] = useState("");

  // Open edit modal and populate with existing data
  function openEditDialog(index) {
    setCurrentEditIndex(index);
    const itemToEdit = taskList[index];

    setEditTitleInput(itemToEdit.title || "");
    setEditSummaryInput(itemToEdit.summary || "");
    setEditStateInput(itemToEdit.state || "Not done");
    setEditDeadlineInput(itemToEdit.deadline || "");

    setIsEditModalVisible(true);
  }

  // Save changes to the edited task
  function confirmEdits() {
    setTaskList((prev) => {
      const updated = [...prev];
      updated[currentEditIndex] = {
        ...updated[currentEditIndex],
        title: editTitleInput,
        summary: editSummaryInput,
        state: editStateInput,
        deadline: editDeadlineInput,
      };
      persistTasks(updated);
      return updated;
    });
    setIsEditModalVisible(false);
  }

  // --------------------- DELETING A TASK ---------------------
  function removeTask(index) {
    setTaskList((prevTasks) => {
      const remaining = prevTasks.filter((_, i) => i !== index);
      persistTasks(remaining);
      return remaining;
    });
  }

  // --------------------- SORT & FILTER OPTIONS ---------------------
  const [highlightState, setHighlightState] = useState(null); // "Done" | "Doing right now" | "Not done" | null
  const [stateFilter, setStateFilter] = useState(null); // same as above
  const [sortByDueDate, setSortByDueDate] = useState(false);

  const tasksToDisplay = deriveDisplayedTasks();

  function deriveDisplayedTasks() {
    let result = [...taskList];

    // 1) Filter by state if specified
    if (stateFilter) {
      result = result.filter((item) => item.state === stateFilter);
    }

    // 2) Optionally bump a specific state to the top
    if (highlightState) {
      result.sort((a, b) => {
        if (a.state === highlightState && b.state !== highlightState) return -1;
        if (b.state === highlightState && a.state !== highlightState) return 1;
        return 0;
      });
    }

    // 3) Sort by deadline date if toggled
    if (sortByDueDate) {
      result.sort((a, b) => {
        const dateA = a.deadline ? new Date(a.deadline) : null;
        const dateB = b.deadline ? new Date(b.deadline) : null;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateA - dateB; 
      });
    }

    return result;
  }

  return (
    <ColorSchemeProvider colorScheme={themeMode} toggleColorScheme={switchThemeMode}>
      <MantineProvider
        theme={{ colorScheme: themeMode, defaultRadius: "md" }}
        withGlobalStyles
        withNormalizeCSS
      >
        <div className="MyTaskApp">
          {/* CREATE NEW TASK MODAL */}
          <Modal
            opened={isCreateModalVisible}
            size="md"
            title="Add a Task"
            withCloseButton
            onClose={() => setIsCreateModalVisible(false)}
            centered
          >
            <TextInput
              label="Title"
              required
              placeholder="Title of the task"
              value={titleInput}
              onChange={(e) => setTitleInput(e.currentTarget.value)}
              mt="md"
            />
            <TextInput
              label="Summary"
              placeholder="Brief overview"
              value={summaryInput}
              onChange={(e) => setSummaryInput(e.currentTarget.value)}
              mt="md"
            />
            <Select
              label="State"
              data={[
                { value: "Done", label: "Done" },
                { value: "Doing right now", label: "Doing right now" },
                { value: "Not done", label: "Not done" },
              ]}
              value={stateInput}
              onChange={setStateInput}
              mt="md"
            />
            {/* If you have @mantine/dates:
                <DatePicker
                  label="Deadline"
                  placeholder="Select a date"
                  value={deadlineInput ? new Date(deadlineInput) : null}
                  onChange={(date) => setDeadlineInput(date?.toISOString() ?? "")}
                  mt="md"
                />
            */}
            <TextInput
              type="date"
              label="Deadline"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.currentTarget.value)}
              mt="md"
            />

            <Group mt="md" position="apart">
              <Button variant="subtle" onClick={() => setIsCreateModalVisible(false)}>
                Close
              </Button>
              <Button onClick={addNewTask}>Add to List</Button>
            </Group>
          </Modal>

          {/* EDIT TASK MODAL */}
          <Modal
            opened={isEditModalVisible}
            size="md"
            title="Edit Task"
            onClose={() => setIsEditModalVisible(false)}
            centered
          >
            <TextInput
              label="Title"
              required
              placeholder="Title of the task"
              value={editTitleInput}
              onChange={(e) => setEditTitleInput(e.currentTarget.value)}
              mt="md"
            />
            <TextInput
              label="Summary"
              placeholder="Brief overview"
              value={editSummaryInput}
              onChange={(e) => setEditSummaryInput(e.currentTarget.value)}
              mt="md"
            />
            <Select
              label="State"
              data={[
                { value: "Done", label: "Done" },
                { value: "Doing right now", label: "Doing right now" },
                { value: "Not done", label: "Not done" },
              ]}
              value={editStateInput}
              onChange={setEditStateInput}
              mt="md"
            />
            <TextInput
              type="date"
              label="Deadline"
              value={editDeadlineInput}
              onChange={(e) => setEditDeadlineInput(e.currentTarget.value)}
              mt="md"
            />

            <Group mt="md" position="apart">
              <Button variant="subtle" onClick={() => setIsEditModalVisible(false)}>
                Cancel
              </Button>
              <Button onClick={confirmEdits}>Save</Button>
            </Group>
          </Modal>

          {/* MAIN CONTENT */}
          <Container size={600} my={40}>
            <Group position="apart">
              <Title
                sx={(theme) => ({
                  fontFamily: `Greycliff CF, ${theme.fontFamily}`,
                  fontWeight: 900,
                })}
              >
                Task Manager
              </Title>
              <ActionIcon color="blue" onClick={() => switchThemeMode()} size="lg">
                {themeMode === "dark" ? <Sun size={16} /> : <MoonStars size={16} />}
              </ActionIcon>
            </Group>

            {/* HIGHLIGHTING & FILTERING BUTTONS */}
            <Group mt="md">
              <Button
                variant={highlightState === "Done" ? "filled" : "light"}
                onClick={() =>
                  setHighlightState((prev) => (prev === "Done" ? null : "Done"))
                }
              >
                Highlight "Done"
              </Button>
              <Button
                variant={highlightState === "Doing right now" ? "filled" : "light"}
                onClick={() =>
                  setHighlightState((prev) =>
                    prev === "Doing right now" ? null : "Doing right now"
                  )
                }
              >
                Highlight "Doing"
              </Button>
              <Button
                variant={highlightState === "Not done" ? "filled" : "light"}
                onClick={() =>
                  setHighlightState((prev) => (prev === "Not done" ? null : "Not done"))
                }
              >
                Highlight "Not done"
              </Button>
            </Group>

            <Group mt="md">
              <Button
                variant={stateFilter === "Done" ? "filled" : "light"}
                onClick={() => setStateFilter((prev) => (prev === "Done" ? null : "Done"))}
              >
                Only "Done"
              </Button>
              <Button
                variant={stateFilter === "Not done" ? "filled" : "light"}
                onClick={() =>
                  setStateFilter((prev) => (prev === "Not done" ? null : "Not done"))
                }
              >
                Only "Not done"
              </Button>
              <Button
                variant={stateFilter === "Doing right now" ? "filled" : "light"}
                onClick={() =>
                  setStateFilter((prev) =>
                    prev === "Doing right now" ? null : "Doing right now"
                  )
                }
              >
                Only "Doing"
              </Button>
            </Group>

            <Button
              mt="md"
              variant={sortByDueDate ? "filled" : "light"}
              onClick={() => setSortByDueDate((prev) => !prev)}
            >
              Sort by Deadline
            </Button>

            {/* TASK CARDS */}
            {tasksToDisplay.length > 0 ? (
              tasksToDisplay.map((task, index) => {
                if (!task.title) return null;
                return (
                  <Card withBorder key={index} mt="sm">
                    <Group position="apart">
                      <Text weight="bold">{task.title}</Text>
                      <Group>
                        <ActionIcon
                          onClick={() => openEditDialog(index)}
                          color="blue"
                          variant="transparent"
                        >
                          <Edit />
                        </ActionIcon>
                        <ActionIcon
                          onClick={() => removeTask(index)}
                          color="red"
                          variant="transparent"
                        >
                          <Trash />
                        </ActionIcon>
                      </Group>
                    </Group>
                    <Text color="dimmed" size="sm" mt="xs">
                      {task.summary
                        ? task.summary
                        : "No summary provided for this task."}
                    </Text>
                    <Text size="sm" mt="xs">
                      <b>State:</b> {task.state}
                    </Text>
                    <Text size="sm" mt="xs">
                      <b>Deadline:</b> {task.deadline ? task.deadline : "No deadline"}
                    </Text>
                  </Card>
                );
              })
            ) : (
              <Text size="lg" mt="md" color="dimmed">
                No tasks available
              </Text>
            )}

            <Button onClick={() => setIsCreateModalVisible(true)} fullWidth mt="md">
              Add Task
            </Button>
          </Container>
        </div>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}
