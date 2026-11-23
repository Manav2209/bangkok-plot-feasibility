import { useStudyController } from './useStudyController';
import { StudyHeader } from './ui/study/StudyHeader';
import { InputsPanel } from './ui/study/InputsPanel';
import { MapWorkspace } from './ui/study/MapWorkspace';
import { ResultsPanel } from './ui/study/ResultsPanel';
import { StudyDialogs } from './ui/study/StudyDialogs';

export default function App() {
  const study = useStudyController();
  return (
    <div className="app-shell">
      <StudyHeader study={study} />
      <div className="workspace">
        <InputsPanel study={study} />
        <MapWorkspace study={study} />
        <ResultsPanel study={study} />
      </div>
      <StudyDialogs study={study} />
    </div>
  );
}
