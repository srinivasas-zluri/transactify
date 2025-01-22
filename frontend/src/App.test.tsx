import { render, screen } from '@testing-library/react';
// import { vi } from 'vitest';
import App from './App';
import * as UseAppState from './hooks/useAppState';
import { vi, describe, it, expect, Mock } from 'vitest';
import { Transaction } from './models/transaction';

vi.mock('./hooks/useAppState', async () => {
  const actualModule = await vi.importActual<typeof UseAppState>('./hooks/useAppState');
  const mods = {
    ...actualModule,
    useAppState: vi.fn(),
    PageState: {
      ...actualModule.PageState,
    },
  };

  return mods;
});


export const CreateTransactionDataFn = (idx: number): Transaction => {
  let randDesc: string;
  if (idx == 10) {
    randDesc = "A".repeat(100);
  } else {
    randDesc = "";
  }
  return {
    id: idx,
    amount: 100,
    description: `Test Transaction ${idx}${randDesc}`,
    transaction_date_string: '2021-10-10',
    transaction_date: new Date('2021-10-10'),
    inr_amount: 100,
    currency: 'INR',
    is_deleted: false,
  }
}

describe('App Component', () => {
  let mockUseAppState: Mock;
  const defaultAppState = {
    pageState: UseAppState.PageState.View,
    transactions: [],
    progress: 0,
    setPage: vi.fn(),
    prev: { page: null },
    next: { page: null },
    uploadFile: vi.fn(),
    onCreateTransaction: vi.fn(),
    onEditCancelClicked: vi.fn(),
    onEditClicked: vi.fn(),
    onEditSaveClicked: vi.fn(),
    onDeleteClicked: vi.fn(),
  }

  beforeEach(() => {
    mockUseAppState = vi.fn();
    (UseAppState.useAppState as Mock) = mockUseAppState;
  });

  it('should render without crashing', () => {
    mockUseAppState.mockReturnValue(defaultAppState);

    render(<App />);

    expect(screen.getByText(/Transaction Management/i)).toBeDefined();
    // expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('should show uploading file progress', () => {
    mockUseAppState.mockReturnValue(defaultAppState && {
      pageState: UseAppState.PageState.UploadingFile,
      progress: 50,
    });

    render(<App />);

    expect(screen.getByText(/Uploading file/i)).toBeDefined();
    expect(screen.getByText(/50% Complete/i)).toBeDefined();
  });


  it('should show uploading file progress', () => {
    mockUseAppState.mockReturnValue(defaultAppState && {
      pageState: UseAppState.PageState.Loading,
    });

    render(<App />);

    expect(screen.getByText(/Loading/i)).toBeDefined();
  });

  it('Should show the transaction view', () => {
    mockUseAppState.mockReturnValue(defaultAppState && {
      pageState: UseAppState.PageState.View,
      transactions: [
        {
          id: 1,
          amount: 100,
          description: 'Test Transaction',
          date: '2021-10-10',
        }
      ],
      prev: { page: 1 },
      next: { page: 2 },
    });

    render(<App />);

    expect(screen.getByText(/Test Transaction/i)).toBeDefined();
  });

});
