'use client';

import React, { useState } from 'react';
import { ContinueReadingShelf } from '../components/pixel/ContinueReadingShelf';
import { UserBookmarksModal } from '../components/pixel/UserBookmarksModal';

export function HomeShelfSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ContinueReadingShelf onOpenBookmarksModal={() => setIsModalOpen(true)} />
      <UserBookmarksModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
