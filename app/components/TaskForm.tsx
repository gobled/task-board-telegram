"use client";

import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

interface TaskFormProps {
  groupId: string;
}

export default function TaskForm({ groupId }: TaskFormProps) {
  const [title, setTitle] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addDoc(collection(db, 'tasks'), {
      title,
      completed: false,
      createdAt: new Date(),
      groupId, // Ajouter le groupId
    });

    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a new task"
        className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition-colors"
      >
        Add Task
      </button>
    </form>
  );
}