package com.taskflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Punto de entrada de TaskFlow.
 *
 * <p>TaskFlow es una aplicacion personal de un solo usuario: no hay registro,
 * login ni sesiones. Por eso ya no se excluye ninguna autoconfiguracion de
 * seguridad (Spring Security no forma parte de las dependencias).</p>
 */
@SpringBootApplication
public class TaskFlowApplication {

    public static void main(String[] args) {
        requireDatabasePassword();
        SpringApplication.run(TaskFlowApplication.class, args);
    }

    /**
     * Falla al arrancar con un mensaje claro si falta la contrasena de la base
     * de datos. Sin esta comprobacion, Spring enviaria el texto literal
     * "${TASKFLOW_DB_PASSWORD}" como contrasena y MySQL respondería con un
     * "Access denied" dificil de interpretar.
     *
     * <p>Los tests no pasan por este metodo: usan H2 y no necesitan la variable.</p>
     */
    private static void requireDatabasePassword() {
        String password = System.getenv("TASKFLOW_DB_PASSWORD");
        if (password == null || password.isBlank()) {
            System.err.println("""
                    ERROR: falta la variable de entorno TASKFLOW_DB_PASSWORD.

                    Define la contrasena de la base de datos antes de arrancar:
                      - En PowerShell:  $env:TASKFLOW_DB_PASSWORD = "tu_contrasena"
                      - O crea .env.local en la raiz del proyecto con:
                            TASKFLOW_DB_PASSWORD=tu_contrasena
                        y carga el entorno con scripts/set-dev-env.ps1 (Windows).

                    Nunca escribas la contrasena en application.yml ni en Git.
                    """);
            System.exit(1);
        }
    }
}
