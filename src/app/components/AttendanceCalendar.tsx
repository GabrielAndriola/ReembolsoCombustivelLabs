import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AttendanceCalendarProps {
  attendanceDates: string[];
  month: number;
  year: number;
  selectedDates?: string[];
  onToggleDate?: (date: string) => void;
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  attendanceDates,
  month,
  year,
  selectedDates = [],
  onToggleDate,
  onPreviousMonth,
  onNextMonth
}) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDateString = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isAttendanceDay = (day: number) => attendanceDates.includes(getDateString(day));

  const isSelectedDay = (day: number) => selectedDates.includes(getDateString(day));

  const isWeekend = (day: number) => {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isFutureDay = (day: number) => {
    const candidate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return candidate > today;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() + 1 &&
      year === today.getFullYear()
    );
  };

  const renderDays = () => {
    const days: React.ReactNode[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const hasAttendance = isAttendanceDay(day);
      const selected = isSelectedDay(day);
      const weekend = isWeekend(day);
      const futureDay = isFutureDay(day);
      const today = isToday(day);
      const dateStr = getDateString(day);
      const isDisabled = hasAttendance || weekend || futureDay;

      days.push(
        <button
          type="button"
          key={day}
          disabled={isDisabled}
          aria-pressed={selected}
          onClick={() => {
            if (!isDisabled) {
              onToggleDate?.(dateStr);
            }
          }}
          className={[
            'aspect-square flex items-center justify-center rounded-lg border text-sm transition-all',
            hasAttendance ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm cursor-not-allowed' : '',
            selected ? 'border-accent bg-accent/15 text-accent font-semibold shadow-sm' : '',
            weekend && !hasAttendance ? 'border-amber-200 bg-amber-50 text-amber-700 cursor-not-allowed' : '',
            futureDay && !hasAttendance && !weekend ? 'border-border bg-muted/40 text-muted-foreground cursor-not-allowed' : '',
            !hasAttendance && !selected && !weekend && !futureDay ? 'border-border text-foreground hover:bg-muted cursor-pointer' : '',
            today && !hasAttendance ? 'ring-2 ring-primary ring-offset-2' : ''
          ].join(' ')}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">
          {monthNames[month - 1]} {year}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPreviousMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((name) => (
            <div
              key={name}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {name}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {renderDays()}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-primary rounded" />
          <span>Dia presencial registrado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-accent bg-accent/15 rounded" />
          <span>Selecionado para registrar</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border border-amber-200 bg-amber-50 rounded" />
          <span>Fim de semana</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
