import React, { useState } from 'react';
import { MapPin, Route, DollarSign, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import type { Employee } from '../lib/mock-data';

interface RegisterAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDates: string[];
  onSubmit: (payload: { dates: string[]; observation: string }) => Promise<void> | void;
  employee?: Employee;
  companyAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    cep: string;
  };
}

const RegisterAttendanceModal: React.FC<RegisterAttendanceModalProps> = ({
  isOpen,
  onClose,
  selectedDates,
  onSubmit,
  employee,
  companyAddress
}) => {
  const [observation, setObservation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDates.length === 0) {
      toast.error('Selecione pelo menos um dia no calendário');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        dates: selectedDates,
        observation: observation.trim()
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      toast.success('Registros de presença criados com sucesso!');

      setTimeout(() => {
        setIsSuccess(false);
        setObservation('');
        onClose();
      }, 2000);
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Não foi possível criar os registros selecionados.');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setIsSuccess(false);
      setObservation('');
      onClose();
    }
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Registros Criados!
            </h3>
            <p className="text-muted-foreground">
              Os dias selecionados foram salvos e aguardam aprovação.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const dailyValue = employee ? employee.kmPerDay * employee.valuePerKm : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Dias Presenciais</DialogTitle>
          <DialogDescription>
            Revise os dias selecionados e crie todos os registros com um único envio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Dias selecionados</Label>
            {selectedDates.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Nenhum dia selecionado no calendário.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedDates.map((date) => (
                  <div
                    key={date}
                    className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-sm font-medium text-accent"
                  >
                    {new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observação para os registros (opcional)</Label>
            <Textarea
              id="observation"
              placeholder="Ex: semana de reuniões presenciais"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="bg-muted/30 rounded-lg p-4 space-y-4 border border-border">
            <h4 className="font-medium text-foreground flex items-center gap-2">
              <Route className="w-4 h-4" />
              Informações Calculadas Automaticamente
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Endereço da Empresa
                </div>
                <div className="text-sm text-foreground">
                  <p>{companyAddress.street}, {companyAddress.number}</p>
                  <p className="text-muted-foreground">
                    {companyAddress.neighborhood} - {companyAddress.city}/{companyAddress.state}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  Seu Endereço
                </div>
                <div className="text-sm text-foreground">
                  <p>{employee?.address.street}, {employee?.address.number}</p>
                  <p className="text-muted-foreground">
                    {employee?.address.neighborhood} - {employee?.address.city}/{employee?.address.state}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Distancia ida</div>
                <div className="text-lg font-semibold text-foreground">
                  {employee?.distanceToCompanyKm?.toFixed(2) ?? '0.00'} km
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Distancia volta</div>
                <div className="text-lg font-semibold text-foreground">
                  {employee?.distanceFromCompanyKm?.toFixed(2) ?? '0.00'} km
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Trajeto total / dia</div>
                <div className="text-lg font-semibold text-foreground">
                  {employee?.kmPerDay.toFixed(2) ?? '0.00'} km
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Valor por km</div>
                <div className="text-lg font-semibold text-foreground">
                  R$ {employee?.valuePerKm.toFixed(2)}
                </div>
              </div>

              <div className="space-y-1 md:col-span-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Valor estimado total
                </div>
                <div className="text-lg font-semibold text-accent">
                  R$ {(dailyValue * selectedDates.length).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || selectedDates.length === 0}>
              {isSubmitting ? 'Salvando...' : `Criar ${selectedDates.length} registro(s)`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterAttendanceModal;
