import { useParams } from 'react-router';

export function BoardPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Board</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Board ID: {id}
      </p>
    </div>
  );
}
