import {
  Alert,
  Breadcrumb,
  Empty,
  Row,
  Col,
  Skeleton,
  Space,
  Card,
} from "antd";
import { Link } from "react-router-dom";
import type { StudentItem } from "../../types/student";

import "maptalks/dist/maptalks.css";
import AppDialog from "../../components/feedback/AppDialog";
import StudentsPageAddClassModal from "./components/StudentsPageAddClassModal";
import StudentsPageAddressModal from "./components/StudentsPageAddressModal";
import StudentsPageClassSummaryCard from "./components/StudentsPageClassSummaryCard";
import StudentsPageSearchCard from "./components/StudentsPageSearchCard";
import StudentsPageStudentClassesModal from "./components/StudentsPageStudentClassesModal";
import StudentsPageStudentsList from "./components/StudentsPageStudentsList";
import StudentsPageTransferModal from "./components/StudentsPageTransferModal";
import { useStudentsPage } from "./useStudentsPage";

export default function StudentsPage() {
  const {
    navigate,
    searchInput,
    setSearchInput,
    handleSearch,
    listTopRef,
    buildWhatsAppUri,
    buildGoogleMapsUri,
    setAddressPreviewStudent,
    geocodeLoading,
    geocodeError,
    mapContainerRef,
    buildAddressLabel,
    classesPreviewStudent,
    setClassesPreviewStudent,
    activeClasses,
    closedClasses,
    showClosedClasses,
    getClassTypeName,
    removeClassTarget,
    setRemoveClassTarget,
    removingStudent,
    handleConfirmRemoveFromClass,
    transferStudent,
    setTransferStudent,
    groupedAvailableClassesForTransfer,
    selectedTransferClassId,
    setSelectedTransferClassId,
    transferringStudent,
    handleConfirmTransferStudent,
    closeTransferModal,
    addClassModalOpen,
    setAddClassModalOpen,
    groupedAvailableClassesForAdd,
    selectedAvailableClassIds,
    handleToggleAvailableClassSelection,
    handleRequestAddToClass,
    addClassConfirmTargets,
    addingStudent,
    studentsQuery,
    selectedClassQuery,
    classId,
    screens,
    canViewDashboards,
    studentDetailsQuery,
    PER_PAGE,
    page,
    handlePageChange,
    addressPreviewStudent,
    transferClassesQuery,
    availableClassesForTransfer,
    setSelectedAvailableClassIds,
    setShowClosedClasses,
    addClassesQuery,
    setAddClassConfirmTargets,
    availableClassesForAdd,
    handleConfirmAddToClass,
  } = useStudentsPage();

  if (studentsQuery.isLoading && !studentsQuery.data) {
    return (
      <Space size={16} style={{ width: "100%", flexDirection: "column" }}>
        <Card>
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>
        <Card>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      </Space>
    );
  }

  if (selectedClassQuery.isError || studentsQuery.isError) {
    return (
      <Alert
        type="error"
        showIcon
        message="Não foi possível carregar os alunos da turma."
      />
    );
  }

  if (!classId) {
    return <Empty description="Turma não informada." />;
  }

  const students = studentsQuery.data?.data ?? [];
  const total = studentsQuery.data?.total ?? 0;
  const selectedClass = selectedClassQuery.data;
  const isMobile = !screens.md;
  const handleViewAcademicLife = (student: StudentItem) => {
    navigate(`/students/${student.id}/academic-life?classId=${classId}`);
  };

  const handlePreviewAddress = (student: StudentItem) => {
    setAddressPreviewStudent(student);
  };

  const handleViewClasses = (student: StudentItem) => {
    setClassesPreviewStudent(student);
  };

  const handleTransferStudent = (student: StudentItem) => {
    setTransferStudent(student);
    setSelectedTransferClassId(null);
  };

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Breadcrumb
        items={[
          { title: <Link to="/class">Turmas</Link> },
          { title: <Link to={`/class/${classId}`}>Gestão da turma</Link> },
          { title: "Alunos" },
        ]}
      />

      <Row gutter={[16, 16]} align="top">
        <Col xs={24} lg={6}>
          <StudentsPageClassSummaryCard
            selectedClass={selectedClass}
            total={total}
            canViewDashboards={canViewDashboards}
            onOpenDashboard={() => navigate("/dashboard")}
          />
        </Col>

        <Col xs={24} lg={18}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <StudentsPageSearchCard
              selectedClass={selectedClass}
              searchInput={searchInput}
              onSearchInputChange={setSearchInput}
              onSearch={handleSearch}
            />

            <div ref={listTopRef} />

            <StudentsPageStudentsList
              students={students}
              total={total}
              page={page}
              perPage={PER_PAGE}
              isMobile={isMobile}
              buildWhatsAppUri={buildWhatsAppUri}
              buildGoogleMapsUri={buildGoogleMapsUri}
              onViewAcademicLife={handleViewAcademicLife}
              onViewClasses={handleViewClasses}
              onTransferStudent={handleTransferStudent}
              onPreviewAddress={handlePreviewAddress}
              onPageChange={handlePageChange}
            />
          </Space>
        </Col>
      </Row>

      <StudentsPageAddressModal
        student={addressPreviewStudent}
        geocodeLoading={geocodeLoading}
        geocodeError={geocodeError}
        mapContainerRef={mapContainerRef}
        buildAddressLabel={buildAddressLabel}
        buildGoogleMapsUri={buildGoogleMapsUri}
        onClose={() => setAddressPreviewStudent(null)}
      />

      <StudentsPageStudentClassesModal
        student={classesPreviewStudent}
        openAddClassModal={() => {
          setAddClassModalOpen(true);
          setSelectedAvailableClassIds([]);
        }}
        isLoading={studentDetailsQuery.isLoading}
        isError={studentDetailsQuery.isError}
        activeClasses={activeClasses}
        closedClasses={closedClasses}
        showClosedClasses={showClosedClasses}
        getClassTypeName={getClassTypeName}
        onToggleClosedClasses={() =>
          setShowClosedClasses((previous) => !previous)
        }
        onRequestRemoveClass={setRemoveClassTarget}
        onClose={() => {
          setClassesPreviewStudent(null);
          setAddClassModalOpen(false);
          setSelectedAvailableClassIds([]);
          setAddClassConfirmTargets([]);
          setShowClosedClasses(false);
        }}
      />

      <AppDialog
        open={Boolean(removeClassTarget)}
        type="danger"
        title="Remover aluno da turma"
        message={
          removeClassTarget
            ? `Tem certeza que deseja remover ${classesPreviewStudent?.name ?? "este aluno"} da turma ${removeClassTarget.name}?`
            : "Tem certeza que deseja remover este aluno da turma?"
        }
        confirmText={removingStudent ? "Removendo..." : "Remover"}
        cancelText="Cancelar"
        onCancel={() => {
          if (!removingStudent) {
            setRemoveClassTarget(null);
          }
        }}
        onConfirm={handleConfirmRemoveFromClass}
      />

      <StudentsPageTransferModal
        student={transferStudent}
        selectedClassName={selectedClass?.name}
        isLoading={transferClassesQuery.isLoading}
        isError={transferClassesQuery.isError}
        availableClasses={availableClassesForTransfer}
        groupedClasses={groupedAvailableClassesForTransfer}
        selectedTransferClassId={selectedTransferClassId}
        transferringStudent={transferringStudent}
        getClassTypeName={getClassTypeName}
        onSelectClass={setSelectedTransferClassId}
        onClose={closeTransferModal}
        onConfirm={handleConfirmTransferStudent}
      />

      <StudentsPageAddClassModal
        open={addClassModalOpen}
        isLoading={studentDetailsQuery.isLoading || addClassesQuery.isLoading}
        isError={studentDetailsQuery.isError || addClassesQuery.isError}
        availableClasses={availableClassesForAdd}
        groupedClasses={groupedAvailableClassesForAdd}
        selectedAvailableClassIds={selectedAvailableClassIds}
        getClassTypeName={getClassTypeName}
        onToggleClass={handleToggleAvailableClassSelection}
        onClose={() => {
          setAddClassModalOpen(false);
          setSelectedAvailableClassIds([]);
        }}
        onConfirm={handleRequestAddToClass}
      />

      <AppDialog
        open={addClassConfirmTargets.length > 0}
        type="warning"
        title={
          addClassConfirmTargets.length > 1
            ? "Confirmar adição em turmas"
            : "Confirmar adição em turma"
        }
        message={
          addClassConfirmTargets.length > 1
            ? `Tem certeza que deseja adicionar ${classesPreviewStudent?.name ?? "este aluno"} em ${addClassConfirmTargets.length} turmas selecionadas?`
            : addClassConfirmTargets.length === 1
              ? `Tem certeza que deseja adicionar ${classesPreviewStudent?.name ?? "este aluno"} na turma ${addClassConfirmTargets[0].name}?`
              : "Tem certeza que deseja adicionar este aluno na turma selecionada?"
        }
        confirmText={addingStudent ? "Adicionando..." : "Adicionar"}
        cancelText="Cancelar"
        onCancel={() => {
          if (!addingStudent) {
            setAddClassConfirmTargets([]);
          }
        }}
        onConfirm={handleConfirmAddToClass}
      />
    </Space>
  );
}
