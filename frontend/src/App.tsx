import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "tailwindcss/tailwind.css";

import { PageState, useAppState } from "./hooks/useAppState";
import { UploadingFile } from "./pages/uploadingFileLoadingPage";
import { TransactionTable } from "./components/table/TransactionTable";
import { TransactionManagementLoadingPage } from "./components/transactionManagement/LoadingPage";
import { UploadFile } from "./components/transactionManagement/UploadFile";
import { PaginationComponent } from "./components/table/Pagination";
import Dashboard from "./pages/dashboard";

const App = () => {
  return (
    <>
      <ToastContainer />
      <ApplicationPage />
    </>
  );
};

const ApplicationPage = () => {
  const {
    pageState,
    progress,
    transactions,
    setPage,
    page,
    prev,
    next,
    uploadFile,
    onCreateTransaction,
    onEditSaveClicked,
    onDeleteClicked,
    onMultipleDeleteClicked,
    setPageState
  } = useAppState();

  if (pageState === PageState.UploadingFile) {
    return <UploadingFile progress={progress} />
  }

  if (pageState === PageState.Loading) {
    return <TransactionManagementLoadingPage />;
  }

  if (pageState === PageState.Analytics) {
    return <Dashboard back={() => setPage(PageState.View)} />;
  }

  const isDataNull = transactions.length === 0 && prev.page === null && next.page === null;

  return (
    <div className="mx-auto p-8 rounded-lg max-w-7xl">
      <h1 className="mb-8 font-semibold text-4xl text-center text-gray-800">Transaction Management</h1>
      <UploadFile onUpload={uploadFile} toast={toast} />

      <span className="p-10" />
      <TransactionTable
        onMultipleDeleteClicked={onMultipleDeleteClicked}
        pageState={pageState}
        transactions={transactions}
        onEditSaveClicked={onEditSaveClicked}
        onDeleteClicked={onDeleteClicked}
        onCreateTransaction={onCreateTransaction}
        goToDashboard={() => setPageState(PageState.Analytics)}
        paginationComponent={<PaginationComponent page={page} prev={prev} next={next} setPage={setPage} />}
      />

      <span className="p-10" />
      {(!isDataNull) && <PaginationComponent page={page} prev={prev} next={next} setPage={setPage} />}
    </div>
  );
};




export default App;
