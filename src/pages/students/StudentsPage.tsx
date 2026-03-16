import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  Alert,
  Breadcrumb,
  Empty,
  Grid,
  message,
  Row,
  Col,
  Skeleton,
  Space,
  Card,
} from "antd";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ADMIN_PERMISSIONS } from "../../access/admin-access";
import { useAdminAccess } from "../../access/use-admin-access";
import type { StudentItem } from "../../types/student";
import type { StudentsListResponse } from "../../types/student";
import {
  getStudentById,
  getStudentsByClassId,
} from "../../services/student/student.service";
import { getClassById, getClasses } from "../../services/class/class.service";
import { getClassTypes } from "../../services/class/class-type.service";
import {
  addStudentToClass,
  removeStudentFromClass,
} from "../../services/class/class.service";
import type { ClassItem } from "../../types/class";
import type { ClassTypeItem } from "../../types/class-type";
import * as maptalks from "maptalks";
import "maptalks/dist/maptalks.css";
import AppDialog from "../../components/feedback/AppDialog";
import StudentsPageAddClassModal from "./components/StudentsPageAddClassModal";
import StudentsPageAddressModal from "./components/StudentsPageAddressModal";
import StudentsPageClassSummaryCard from "./components/StudentsPageClassSummaryCard";
import StudentsPageSearchCard from "./components/StudentsPageSearchCard";
import StudentsPageStudentClassesModal from "./components/StudentsPageStudentClassesModal";
import StudentsPageStudentsList from "./components/StudentsPageStudentsList";
import StudentsPageTransferModal from "./components/StudentsPageTransferModal";

const PER_PAGE = 15;
type MapCoordinates = [number, number];

export default function StudentsPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const { hasPermission } = useAdminAccess();
  const canViewDashboards = hasPermission(
    ADMIN_PERMISSIONS.visualizarDashboards,
  );
  const listTopRef = useRef<HTMLDivElement | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maptalks.Map | null>(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [addressPreviewStudent, setAddressPreviewStudent] =
    useState<StudentItem | null>(null);
  const [classesPreviewStudent, setClassesPreviewStudent] =
    useState<StudentItem | null>(null);
  const [removeClassTarget, setRemoveClassTarget] = useState<ClassItem | null>(
    null,
  );
  const [transferStudent, setTransferStudent] = useState<StudentItem | null>(
    null,
  );
  const [selectedTransferClassId, setSelectedTransferClassId] = useState<
    string | null
  >(null);
  const [addClassModalOpen, setAddClassModalOpen] = useState(false);
  const [selectedAvailableClassIds, setSelectedAvailableClassIds] = useState<
    string[]
  >([]);
  const [addClassConfirmTargets, setAddClassConfirmTargets] = useState<
    ClassItem[]
  >([]);
  const [showClosedClasses, setShowClosedClasses] = useState(false);
  const [removingStudent, setRemovingStudent] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [transferringStudent, setTransferringStudent] = useState(false);
  const [mapCoordinates, setMapCoordinates] = useState<MapCoordinates | null>(
    null,
  );
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const normalizedSearch = useMemo(() => searchTerm.trim(), [searchTerm]);

  const selectedClassQuery = useQuery<ClassItem | null>({
    queryKey: ["class", classId],
    queryFn: () => getClassById(classId ?? ""),
    enabled: Boolean(classId),
  });

  const studentsQuery = useQuery<StudentsListResponse>({
    queryKey: ["students", "student-page", classId, page, normalizedSearch],
    queryFn: () =>
      getStudentsByClassId({
        classId: classId ?? "",
        page,
        perPage: PER_PAGE,
        search: normalizedSearch,
      }),
    enabled: Boolean(classId),
  });

  const classTypesQuery = useQuery<ClassTypeItem[]>({
    queryKey: ["class-types"],
    queryFn: getClassTypes,
  });

  const transferClassesQuery = useQuery<ClassItem[]>({
    queryKey: [
      "classes-transfer-options",
      selectedClassQuery.data?.campusId ?? "all",
    ],
    queryFn: () => getClasses(selectedClassQuery.data?.campusId),
    enabled: Boolean(transferStudent),
  });

  const addClassesQuery = useQuery<ClassItem[]>({
    queryKey: ["classes-add-options"],
    queryFn: () => getClasses(),
    enabled: addClassModalOpen && Boolean(classesPreviewStudent),
  });

  const studentDetailsQuery = useQuery({
    queryKey: ["student-details", classesPreviewStudent?.id],
    queryFn: () => getStudentById(classesPreviewStudent?.id ?? ""),
    enabled: Boolean(classesPreviewStudent?.id),
  });

  const classTypeNameMap = useMemo(() => {
    const entries = classTypesQuery.data ?? [];
    return new Map(entries.map((item) => [item.id, item.name]));
  }, [classTypesQuery.data]);

  const getClassTypeName = useCallback(
    (classTypeId?: string | null) => {
      return classTypeId ? classTypeNameMap.get(classTypeId) : undefined;
    },
    [classTypeNameMap],
  );

  const activeClasses = useMemo<ClassItem[]>(() => {
    const subscriptions = studentDetailsQuery.data?.subscriptions ?? [];

    return subscriptions.map((item) => ({
      id: item.id,
      name: item.name,
      initDate: item.initDate,
      finishDate: item.finishDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      classTypeId: item.classTypeId ?? "",
      campusId: item.campus_id,
    }));
  }, [studentDetailsQuery.data]);

  const closedClasses = useMemo<ClassItem[]>(() => {
    const subscriptions = studentDetailsQuery.data?.previousSubscriptions ?? [];

    return subscriptions.map((item) => ({
      id: item.id,
      name: item.name,
      initDate: item.initDate,
      finishDate: item.finishDate,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      classTypeId: item.classTypeId ?? "",
      campusId: item.campus_id,
    }));
  }, [studentDetailsQuery.data]);

  const availableClassesForAdd = useMemo<ClassItem[]>(() => {
    const existingClassIds = new Set<string>();

    (studentDetailsQuery.data?.subscriptions ?? []).forEach((item) => {
      existingClassIds.add(item.id);
    });
    (studentDetailsQuery.data?.previousSubscriptions ?? []).forEach((item) => {
      existingClassIds.add(item.id);
    });

    return (addClassesQuery.data ?? []).filter(
      (item) => !existingClassIds.has(item.id),
    );
  }, [
    addClassesQuery.data,
    studentDetailsQuery.data?.previousSubscriptions,
    studentDetailsQuery.data?.subscriptions,
  ]);

  const groupedAvailableClassesForAdd = useMemo(() => {
    const groupedMap = new Map<string, ClassItem[]>();

    availableClassesForAdd.forEach((item) => {
      const typeName = getClassTypeName(item.classTypeId) ?? "Sem tipo";
      const current = groupedMap.get(typeName) ?? [];
      groupedMap.set(typeName, [...current, item]);
    });

    return Array.from(groupedMap.entries()).map(([typeName, items]) => ({
      typeName,
      items,
    }));
  }, [availableClassesForAdd, getClassTypeName]);

  const availableClassesForTransfer = useMemo<ClassItem[]>(() => {
    return (transferClassesQuery.data ?? []).filter(
      (item) => item.id !== classId,
    );
  }, [classId, transferClassesQuery.data]);

  const groupedAvailableClassesForTransfer = useMemo(() => {
    const groupedMap = new Map<string, ClassItem[]>();

    availableClassesForTransfer.forEach((item) => {
      const typeName = getClassTypeName(item.classTypeId) ?? "Sem tipo";
      const current = groupedMap.get(typeName) ?? [];
      groupedMap.set(typeName, [...current, item]);
    });

    return Array.from(groupedMap.entries()).map(([typeName, items]) => ({
      typeName,
      items,
    }));
  }, [availableClassesForTransfer, getClassTypeName]);

  const closeTransferModal = () => {
    if (transferringStudent) {
      return;
    }

    setTransferStudent(null);
    setSelectedTransferClassId(null);
  };

  const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const responseMessage = error.response?.data?.message;

      if (typeof responseMessage === "string" && responseMessage.trim()) {
        return responseMessage;
      }
    }

    if (error instanceof Error && error.message.trim()) {
      return error.message;
    }

    return null;
  };

  const refetchStudentsData = async (studentIdToRefresh?: string) => {
    const requests: Array<Promise<unknown>> = [studentsQuery.refetch()];

    if (
      classesPreviewStudent?.id &&
      (!studentIdToRefresh || classesPreviewStudent.id === studentIdToRefresh)
    ) {
      requests.push(studentDetailsQuery.refetch());
    }

    await Promise.all(requests);
  };

  const handleSearch = (value: string) => {
    setPage(1);
    setSearchTerm(value.trim());
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const buildWhatsAppUri = (phone?: string | null) => {
    const digits = (phone ?? "").replace(/\D/g, "");

    if (!digits) {
      return null;
    }

    const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
    return `https://wa.me/${withCountryCode}`;
  };

  const buildAddressLabel = (student: StudentItem) => {
    const firstLine = [student.address, student.numberAddress]
      .filter(Boolean)
      .join(", ");
    const secondLine = [student.complementString, student.neighborhood]
      .filter(Boolean)
      .join(" - ");
    const thirdLine = [student.city, student.state, student.zipCode]
      .filter(Boolean)
      .join(" - ");

    return [firstLine, secondLine, thirdLine].filter(Boolean).join(" | ");
  };

  const buildGoogleMapsUri = (student: StudentItem) => {
    const address = buildAddressLabel(student);

    if (!address) {
      return null;
    }

    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  const handleConfirmRemoveFromClass = async () => {
    if (!removeClassTarget || !classesPreviewStudent) {
      return;
    }

    try {
      setRemovingStudent(true);

      await removeStudentFromClass({
        classId: removeClassTarget.id,
        studentId: classesPreviewStudent.id,
      });

      await refetchStudentsData(classesPreviewStudent.id);

      message.success("Aluno removido da turma com sucesso.");
      setRemoveClassTarget(null);
    } catch {
      message.error("Não foi possível remover o aluno da turma.");
    } finally {
      setRemovingStudent(false);
    }
  };

  const handleRequestAddToClass = () => {
    const selectedClasses = availableClassesForAdd.filter((item) =>
      selectedAvailableClassIds.includes(item.id),
    );

    if (selectedClasses.length === 0) {
      message.warning("Selecione ao menos uma turma para continuar.");
      return;
    }

    setAddClassConfirmTargets(selectedClasses);
  };

  const handleConfirmAddToClass = async () => {
    if (addClassConfirmTargets.length === 0 || !classesPreviewStudent) {
      return;
    }

    try {
      setAddingStudent(true);

      await Promise.all(
        addClassConfirmTargets.map((classItem) =>
          addStudentToClass({
            classId: classItem.id,
            studentId: classesPreviewStudent.id,
          }),
        ),
      );

      await refetchStudentsData(classesPreviewStudent.id);

      message.success(
        addClassConfirmTargets.length === 1
          ? "Aluno adicionado na turma com sucesso."
          : `Aluno adicionado em ${addClassConfirmTargets.length} turmas com sucesso.`,
      );
      setAddClassConfirmTargets([]);
      setAddClassModalOpen(false);
      setSelectedAvailableClassIds([]);
    } catch {
      message.error("Não foi possível adicionar o aluno na turma.");
    } finally {
      setAddingStudent(false);
    }
  };

  const handleToggleAvailableClassSelection = (classIdToToggle: string) => {
    setSelectedAvailableClassIds((previous) => {
      if (previous.includes(classIdToToggle)) {
        return previous.filter((item) => item !== classIdToToggle);
      }

      return [...previous, classIdToToggle];
    });
  };

  const handleConfirmTransferStudent = async () => {
    if (!transferStudent || !selectedTransferClassId || !classId) {
      return;
    }

    const targetClass = availableClassesForTransfer.find(
      (item) => item.id === selectedTransferClassId,
    );

    if (!targetClass) {
      message.warning("Selecione uma turma válida para continuar.");
      return;
    }

    try {
      setTransferringStudent(true);

      await addStudentToClass({
        classId: targetClass.id,
        studentId: transferStudent.id,
      });
    } catch (error) {
      const backendMessage = getErrorMessage(error);

      if (backendMessage === "Estudante já está na turma") {
        message.error("O aluno já está vinculado à turma selecionada.");
      } else {
        message.error(
          backendMessage ??
            "Não foi possível iniciar a transferência do aluno.",
        );
      }

      setTransferringStudent(false);
      return;
    }

    try {
      await removeStudentFromClass({
        classId,
        studentId: transferStudent.id,
      });

      await refetchStudentsData(transferStudent.id);

      message.success(
        `Aluno transferido para a turma ${targetClass.name} com sucesso.`,
      );
      setTransferStudent(null);
      setSelectedTransferClassId(null);
    } catch (error) {
      await refetchStudentsData(transferStudent.id);

      const backendMessage = getErrorMessage(error);
      message.error(
        backendMessage
          ? `Transferência parcial: o aluno foi adicionado na nova turma, mas não foi removido da turma atual. ${backendMessage}`
          : "Transferência parcial: o aluno foi adicionado na nova turma, mas não foi removido da turma atual.",
      );

      setTransferStudent(null);
      setSelectedTransferClassId(null);
    } finally {
      setTransferringStudent(false);
    }
  };

  useEffect(() => {
    async function geocodeAddress() {
      if (!addressPreviewStudent) {
        setMapCoordinates(null);
        setGeocodeError(null);
        setGeocodeLoading(false);
        return;
      }

      const addressLabel = buildAddressLabel(addressPreviewStudent);

      if (!addressLabel) {
        setMapCoordinates(null);
        setGeocodeError("Endereço indisponível para localização no mapa.");
        return;
      }

      try {
        setGeocodeLoading(true);
        setGeocodeError(null);

        const query = encodeURIComponent(addressLabel);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${query}`,
          {
            headers: {
              Accept: "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error("Não foi possível geocodificar o endereço.");
        }

        const results = (await response.json()) as Array<{
          lat: string;
          lon: string;
        }>;

        if (!results.length) {
          setMapCoordinates(null);
          setGeocodeError("Não foi possível localizar este endereço no mapa.");
          return;
        }

        const latitude = Number(results[0].lat);
        const longitude = Number(results[0].lon);

        setMapCoordinates([longitude, latitude]);
      } catch {
        setMapCoordinates(null);
        setGeocodeError("Falha ao carregar o mapa para este endereço.");
      } finally {
        setGeocodeLoading(false);
      }
    }

    geocodeAddress();
  }, [addressPreviewStudent]);

  useEffect(() => {
    if (!addressPreviewStudent || !mapCoordinates || !mapContainerRef.current) {
      return;
    }

    const coordinate = new maptalks.Coordinate(
      mapCoordinates[0],
      mapCoordinates[1],
    );

    if (!mapRef.current) {
      const map = new maptalks.Map(mapContainerRef.current, {
        center: coordinate,
        zoom: 16,
        attribution: false,
        baseLayer: new maptalks.TileLayer("base", {
          urlTemplate: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          subdomains: ["a", "b", "c"],
        }),
      });

      const markerLayer = new maptalks.VectorLayer("marker").addTo(map);

      new maptalks.Marker(coordinate, {
        symbol: {
          markerType: "ellipse",
          markerFill: "#3B67E0",
          markerLineColor: "#FFFFFF",
          markerLineWidth: 2,
          markerWidth: 16,
          markerHeight: 16,
        },
      }).addTo(markerLayer);

      mapRef.current = map;
      return;
    }

    mapRef.current.setCenter(coordinate);
    mapRef.current.setZoom(16);
  }, [addressPreviewStudent, mapCoordinates]);

  useEffect(() => {
    if (!addressPreviewStudent && mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, [addressPreviewStudent]);

  useEffect(() => {
    setShowClosedClasses(false);
  }, [classesPreviewStudent?.id]);

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
