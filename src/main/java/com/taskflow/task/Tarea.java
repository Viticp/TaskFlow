package com.taskflow.task;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

/**
 * Tarea persistente. Se mapea contra la tabla {@code tareas} que ya existe en
 * MySQL (creada por la migracion {@code V1} y adaptada por {@code V2}).
 *
 * <p>No se usa {@code @CreationTimestamp} ni {@code @UpdateTimestamp} de
 * Hibernate: las fechas se asignan a mano en {@link #alCrear()} y
 * {@link #alActualizar()} para que el comportamiento sea visible al leer el
 * codigo. La base de datos tiene {@code DEFAULT CURRENT_TIMESTAMP}, pero no se
 * depende de el: si la aplicacion inserta una fila, envia la fecha.</p>
 *
 * <p>Se guardan en UTC. La conexion usa {@code hibernate.jdbc.time_zone: UTC}
 * y {@code serverTimezone=UTC}, asi que la hora es consistente entre MySQL y H2.</p>
 */
@Entity
@Table(name = "tareas")
public class Tarea {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String titulo;

    @Column(length = 2000)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Prioridad prioridad;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Estado estado;

    @Column(name = "fecha_limite")
    private LocalDate fechaLimite;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private LocalDateTime creadoEn;

    @Column(name = "actualizado_en", nullable = false)
    private LocalDateTime actualizadoEn;

    protected Tarea() {
        // Requerido por JPA.
    }

    public Tarea(String titulo, String descripcion, Prioridad prioridad, Estado estado, LocalDate fechaLimite) {
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.prioridad = prioridad;
        this.estado = estado;
        this.fechaLimite = fechaLimite;
    }

    @PrePersist
    void alCrear() {
        LocalDateTime ahora = ahora();
        this.creadoEn = ahora;
        this.actualizadoEn = ahora;
        if (this.estado == null) {
            this.estado = Estado.PENDIENTE;
        }
    }

    @PreUpdate
    void alActualizar() {
        this.actualizadoEn = ahora();
    }

    /**
     * Las columnas {@code TIMESTAMP} de MySQL guardan segundos, sin fracciones.
     * Se recorta a segundos para que lo que devuelve la API coincida exactamente
     * con lo que se lee despues de la base de datos.
     */
    private static LocalDateTime ahora() {
        return LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
    }

    public Long getId() {
        return id;
    }

    public String getTitulo() {
        return titulo;
    }

    public void setTitulo(String titulo) {
        this.titulo = titulo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public Prioridad getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(Prioridad prioridad) {
        this.prioridad = prioridad;
    }

    public Estado getEstado() {
        return estado;
    }

    public void setEstado(Estado estado) {
        this.estado = estado;
    }

    public LocalDate getFechaLimite() {
        return fechaLimite;
    }

    public void setFechaLimite(LocalDate fechaLimite) {
        this.fechaLimite = fechaLimite;
    }

    public LocalDateTime getCreadoEn() {
        return creadoEn;
    }

    public LocalDateTime getActualizadoEn() {
        return actualizadoEn;
    }
}
