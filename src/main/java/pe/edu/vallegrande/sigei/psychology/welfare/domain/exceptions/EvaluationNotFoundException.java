package pe.edu.vallegrande.sigei.psychology.welfare.domain.exceptions;

public class EvaluationNotFoundException extends NotFoundException {
    public EvaluationNotFoundException(String id) {
        super("Evaluación psicológica no encontrada con ID: " + id);
    }
}
