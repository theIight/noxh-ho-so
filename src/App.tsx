import { useState } from 'react';
import { createHashRouter, RouterProvider, type RouteObject } from 'react-router';
import { DraftProvider } from './state/DraftProvider';
import { Layout } from './components/Layout';
import { HomePage } from './features/home/HomePage';
import { StepGroupPage } from './features/wizard/StepGroupPage';
import { StepHousingPage } from './features/wizard/StepHousingPage';
import { StepInfoPage } from './features/wizard/StepInfoPage';
import { ResultPage } from './features/result/ResultPage';
import { NotFoundPage } from './components/NotFoundPage';

// Hash router: chạy được trên hosting tĩnh (GitHub/Cloudflare Pages) không cần rewrite.
const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'buoc-1', element: <StepGroupPage /> },
      { path: 'buoc-2', element: <StepHousingPage /> },
      { path: 'buoc-3', element: <StepInfoPage /> },
      { path: 'ket-qua', element: <ResultPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export function App() {
  const [router] = useState(() => createHashRouter(routes));
  return (
    <DraftProvider>
      <RouterProvider router={router} />
    </DraftProvider>
  );
}
