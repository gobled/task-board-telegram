"use client";

import { Task } from '@/app/types/task';

interface TaskItemProps {
  task: Task;
  onToggleTask: () => void;
  onDeleteTask: () => void;
}

export default function TaskItem({ task, onToggleTask, onDeleteTask }: TaskItemProps) {
  return (
    <li className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
      <div className="flex items-center space-x-4">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={onToggleTask}
          className="form-checkbox h-5 w-5 text-blue-600"
        />
        <span className={task.completed ? 'line-through text-gray-500' : ''}>
          {task.title}
        </span>
      </div>
      <button
        onClick={onDeleteTask}
        className="text-red-500 hover:text-red-700"
      >
        Delete
      </button>
    </li>
  );
}
