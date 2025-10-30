"use client";

import { Suspense, useEffect, useState } from 'react';
import Image from "next/image";
import TaskList from "./components/TaskList";
import TaskForm from "./components/TaskForm";
import { useLaunchParams } from "@telegram-apps/sdk-react";
import dynamic from 'next/dynamic';
import { createTask, loadTasks, saveTasks } from "@/app/lib/tasksStorage";
import { Task } from "@/app/types/task";

// Créer un composant client-only pour le TaskBoard
const TaskBoardClient = dynamic(() => Promise.resolve(TaskBoard), {
  ssr: false
});

function TaskBoard() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const launchParams = useLaunchParams();

  useEffect(() => {
    const initializeComponent = async () => {
      try {
       
        if (launchParams?.startParam) {
          const encodedGroupId = launchParams.startParam;
          try {
            const decodedGroupId = atob(encodedGroupId);
            console.log("Decoded Group ID:", decodedGroupId);
            setGroupId(decodedGroupId);
            setTasks(loadTasks(decodedGroupId));
          } catch (error) {
            console.error("Error decoding group ID:", error);
            setError("Invalid group ID format");
          }
        } else {
          console.log("No start_param available");
          setError("No group ID provided");
        }
      } catch (error) {
        console.error("Error in initializeComponent:", error);
        setError("An error occurred while initializing the component");
      } finally {
        setIsLoading(false);
      }
    };

    initializeComponent();
  }, [launchParams]);

  useEffect(() => {
    if (!groupId) {
      return;
    }

    setTasks(loadTasks(groupId));
  }, [groupId]);

  const handleAddTask = (title: string) => {
    setTasks((prev) => {
      if (!groupId) {
        return prev;
      }

      const newTask = createTask(groupId, title);
      const updatedTasks = [...prev, newTask];
      saveTasks(groupId, updatedTasks);
      return updatedTasks;
    });
  };

  const handleToggleTask = (taskId: string) => {
    setTasks((prev) => {
      if (!groupId) {
        return prev;
      }

      const updatedTasks = prev.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      saveTasks(groupId, updatedTasks);
      return updatedTasks;
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => {
      if (!groupId) {
        return prev;
      }

      const updatedTasks = prev.filter((task) => task.id !== taskId);
      saveTasks(groupId, updatedTasks);
      return updatedTasks;
    });
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">{error}</div>;
  }

  if (!groupId) {
    return <div className="p-8">Please provide a valid group ID</div>;
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8 gap-8">
      <header className="flex items-center justify-between">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <h1 className="text-2xl font-bold">Task Board - Group {groupId}</h1>
      </header>

      <main className="flex flex-col gap-8">
        <TaskForm onAddTask={handleAddTask} />
        <TaskList
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />
      </main>

      <footer className="flex justify-center text-sm text-gray-500">
        Powered by Next.js
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <TaskBoardClient />
    </Suspense>
  );
}
