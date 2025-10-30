"use client";

import TaskItem from '@/app/components/TaskItem';
import { Task } from '@/app/types/task';

interface TaskListProps {
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function TaskList({ tasks, onToggleTask, onDeleteTask }: TaskListProps) {
  return (
    <ul className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleTask={() => onToggleTask(task.id)}
          onDeleteTask={() => onDeleteTask(task.id)}
        />
      ))}
    </ul>
  );
}
