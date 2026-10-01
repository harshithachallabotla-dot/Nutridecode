import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Nutri Decode heading', () => {
  render(<App />);
  expect(screen.getByText('Nutri Decode')).toBeInTheDocument();
});

test('displays get started button', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /get started/i })).toBeInTheDocument();
});