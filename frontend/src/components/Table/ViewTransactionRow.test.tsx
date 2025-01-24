import { render, screen, fireEvent  } from '@testing-library/react';
import { ViewTransactionRow } from './ViewTransactionRow';
import { Transaction } from '@/models/transaction';
import { expect, vi } from 'vitest';

const mockTransaction: Transaction = {
  id: 1,
    is_deleted: false,
  transaction_date: new Date('2025-01-01'),
  transaction_date_string: '2025-01-01',
  description: 'Test Transaction',
  amount: 100,
  currency: 'USD',
  inr_amount: 7500
};

const mockOnCheckboxChange = vi.fn();
const mockOnEditSave = vi.fn();
const mockOnDelete = vi.fn();

describe('ViewTransactionRow', () => {
  it('renders transaction details correctly', () => {
    render(
      <ViewTransactionRow
        transaction={mockTransaction}
        onEditSave={mockOnEditSave}
        onDelete={mockOnDelete}
        onCheckboxChange={mockOnCheckboxChange}
        selected={false}
      />
    );

    // Check that the transaction date, description, amount, and currency are rendered
    expect(screen.getByText('2025-01-01')).toBeDefined();
    expect(screen.getByText('Test Transaction')).toBeDefined();
    expect(screen.getByText('$100.00')).toBeDefined();
    expect(screen.getByText('USD')).toBeDefined();
    expect(screen.getByText('Rs.7500')).toBeDefined();
  });

  it('calls onCheckboxChange when checkbox is clicked', () => {
    render(
      <ViewTransactionRow
        transaction={mockTransaction}
        onEditSave={mockOnEditSave}
        onDelete={mockOnDelete}
        onCheckboxChange={mockOnCheckboxChange}
        selected={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnCheckboxChange).toHaveBeenCalledWith(mockTransaction.id, true);
  });

  it('opens the edit dialog on edit button click', () => {
    render(
      <ViewTransactionRow
        transaction={mockTransaction}
        onEditSave={mockOnEditSave}
        onDelete={mockOnDelete}
        onCheckboxChange={mockOnCheckboxChange}
        selected={false}
      />
    );

    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);

    // Check if the dialog content is displayed (EditTransactionDialog should render)
    expect(screen.getByText('Edit Transaction')).toBeDefined();
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <ViewTransactionRow
        transaction={mockTransaction}
        onEditSave={mockOnEditSave}
        onDelete={mockOnDelete}
        onCheckboxChange={mockOnCheckboxChange}
        selected={false}
      />
    );

    // delete-button
    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);

    // Trigger confirmation
    const confirmButton = screen.getByText('Yes');
    fireEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalled();
  });
});
