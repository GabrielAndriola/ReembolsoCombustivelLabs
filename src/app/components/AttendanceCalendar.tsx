import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AttendanceCalendarProps {
  attendanceDates: string[];
  periodStart: string;
  periodEnd: string;
  selectedDates?: string[];
  onToggleDate?: (date: string) => void;
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
}

type CalendarMonth = {
  year: number;
  month: number;
  rangeStartDay: number;
  rangeEndDay: number;
};

const monthNames = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const parseDateParts = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return { year, month, day };
};

const formatDateString = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const formatDateLabel = (value: string) => {
  const { year, month, day } = parseDateParts(value);
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
};

const buildCalendarMonths = (periodStart: string, periodEnd: string) => {
  const startParts = parseDateParts(periodStart);
  const endParts = parseDateParts(periodEnd);
  const months: CalendarMonth[] = [];
  const cursor = new Date(startParts.year, startParts.month - 1, 1);
  const limit = new Date(endParts.year, endParts.month - 1, 1);

  while (cursor <= limit) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const rangeStartDay =
      year === startParts.year && month === startParts.month ? startParts.day : 1;
    const rangeEndDay =
      year === endParts.year && month === endParts.month ? endParts.day : daysInMonth;

    months.push({ year, month, rangeStartDay, rangeEndDay });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
};

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({
  attendanceDates,
  periodStart,
  periodEnd,
  selectedDates = [],
  onToggleDate,
  onPreviousMonth,
  onNextMonth
}) => {
  const calendarMonths = buildCalendarMonths(periodStart, periodEnd);

  const isAttendanceDay = (date: string) => attendanceDates.includes(date);

  const isSelectedDay = (date: string) => selectedDates.includes(date);

  const isWeekend = (year: number, month: number, day: number) => {
    const dayOfWeek = new Date(year, month - 1, day).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const isFutureDay = (year: number, month: number, day: number) => {
    const candidate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return candidate > today;
  };

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() + 1 &&
      year === today.getFullYear()
    );
  };

  const renderMonth = ({ year, month, rangeStartDay, rangeEndDay }: CalendarMonth) => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const days: React.ReactNode[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-leading-${year}-${month}-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      if (day < rangeStartDay || day > rangeEndDay) {
        days.push(<div key={`empty-range-${year}-${month}-${day}`} className="aspect-square rounded-lg bg-muted/10" />);
        continue;
      }

      const dateStr = formatDateString(year, month, day);
      const hasAttendance = isAttendanceDay(dateStr);
      const selected = isSelectedDay(dateStr);
      const weekend = isWeekend(year, month, day);
      const futureDay = isFutureDay(year, month, day);
      const today = isToday(year, month, day);
      const isDisabled = hasAttendance || weekend || futureDay;

      days.push(
        <button
          type="button"
          key={dateStr}
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

    return (
      <div key={`${year}-${month}`} className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">
            {monthNames[month - 1]} {year}
          </h4>
          <span className="text-xs text-muted-foreground">
            Dias liberados: {String(rangeStartDay).padStart(2, '0')} a {String(rangeEndDay).padStart(2, '0')}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((name) => (
            <div
              key={`${year}-${month}-${name}`}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {name}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-foreground">Periodo operacional</h3>
          <p className="text-sm text-muted-foreground">
            {formatDateLabel(periodStart)} ate {formatDateLabel(periodEnd)}
          </p>
        </div>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {calendarMonths.map(renderMonth)}
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
