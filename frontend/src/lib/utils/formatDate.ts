export const formatDate = (dateInput: string | number | Date): string => {
  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    console.warn("Data inválida fornecida para formatDatePtBr:", dateInput);
    return "";
  }

  return date.toLocaleDateString("pt-BR");
};
