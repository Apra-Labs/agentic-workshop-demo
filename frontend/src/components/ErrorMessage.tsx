interface ErrorMessageProps {
  message: string;
}

function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="error">
      <p>{message}</p>
    </div>
  );
}

export default ErrorMessage;
