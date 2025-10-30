'use client';

import { Task } from '@/app/types/task';

const STORAGE_KEY = 'task-board-tasks';

type TaskStore = Record<string, Task[]>;

const getStorage = (): TaskStore => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as TaskStore;
    return parsed ?? {};
  } catch {
    return {};
  }
};

const persist = (data: TaskStore) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const loadTasks = (groupId: string): Task[] => {
  const store = getStorage();
  const tasks = store[groupId] ?? [];
  return tasks.map((task) => ({
    ...task,
    createdAt: task.createdAt ?? new Date().toISOString(),
  }));
};

export const saveTasks = (groupId: string, tasks: Task[]) => {
  const store = getStorage();
  store[groupId] = tasks;
  persist(store);
};

const createTaskId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return Math.random().toString(36).slice(2, 11);
};

export const createTask = (groupId: string, title: string): Task => ({
  id: createTaskId(),
  title,
  completed: false,
  createdAt: new Date().toISOString(),
  groupId,
});
