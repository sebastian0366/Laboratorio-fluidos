// Variables del DOM
let hSlider, bSlider, thetaSlider, massSlider;
let hVal, bVal, thetaVal, massVal;
let frOut, cpOut, tOut;

// Constantes Físicas (Unidades SI)
const rho = 1000; // Densidad del agua (kg/m^3)
const g = 9.81;   // Gravedad (m/s^2)
const L = 4.0;    // Longitud total de la compuerta (m)
const y_hinge = 3.5; // Altura de la bisagra desde el suelo (m)

function setup() {
    // Vincular el canvas al contenedor HTML
    let canvasContainer = select('#canvas-container');
    let canvas = createCanvas(canvasContainer.width, canvasContainer.height);
    canvas.parent('canvas-container');

    // Capturar elementos del DOM
    hSlider = select('#h-slider');
    bSlider = select('#b-slider');
    thetaSlider = select('#theta-slider');
    massSlider = select('#mass-slider');

    hVal = select('#h-val');
    bVal = select('#b-val');
    thetaVal = select('#theta-val');
    massVal = select('#mass-val');

    frOut = select('#fr-out');
    cpOut = select('#cp-out');
    tOut = select('#t-out');
}

function draw() {
    background(255);

    // 1. Leer parámetros del usuario
    let h = parseFloat(hSlider.value());
    let b = parseFloat(bSlider.value());
    let theta_deg = parseFloat(thetaSlider.value());
    let mass = parseFloat(massSlider.value());

    // Actualizar textos en la interfaz
    hVal.html(h.toFixed(2));
    bVal.html(b.toFixed(2));
    thetaVal.html(theta_deg);
    massVal.html(mass);

    // 2. Cálculos Físicos
    let theta_rad = radians(theta_deg);
    
    // Coordenada s a lo largo de la compuerta (s=0 en bisagra, s=L en el fondo)
    // Coordenada y desde el suelo: y(s) = y_hinge - s * sin(theta)
    
    // ¿Dónde toca el agua a la compuerta?
    // h = y_hinge - s_water * sin(theta) => s_water = (y_hinge - h) / sin(theta)
    let s_water = (y_hinge - h) / sin(theta_rad);
    
    // Límites de sumersión
    if (s_water < 0) s_water = 0; // El agua sobrepasa la bisagra
    
    let Ls = 0; // Longitud sumergida
    let F_R = 0;
    let s_cp = 0; // Centro de presión medido desde la bisagra
    let Tension = 0;

    if (s_water < L && h > 0) {
        // La compuerta está parcialmente (o totalmente) sumergida
        Ls = L - s_water;
        
        // Profundidad del centroide de la parte sumergida
        // El centroide de Ls está en s_c = s_water + Ls/2
        let s_c = s_water + Ls / 2;
        let hc = h - (y_hinge - s_c * sin(theta_rad));
        if (hc < 0) hc = 0; // Por seguridad

        // Área mojada
        let Area = b * Ls;

        // Fuerza Resultante (N)
        F_R = rho * g * hc * Area;

        // Centro de presión (desde la bisagra)
        // La distancia desde la superficie del agua a lo largo de la compuerta hasta el CP es (2/3)*Ls
        // Por lo tanto, desde la bisagra es s_water + (2/3)*Ls
        s_cp = s_water + (2/3) * Ls;

        // Tensión del cable (asumiendo cable perpendicular al final de la compuerta, s=L)
        // Suma de Momentos en Bisagra = 0
        // Momentos a favor del reloj: Peso y Agua. Momento en contra: Tensión
        let M_water = F_R * s_cp;
        let M_weight = (mass * g) * (L / 2) * cos(theta_rad);
        
        Tension = (M_water + M_weight) / L;
    } else {
        // Compuerta en seco
        let M_weight = (mass * g) * (L / 2) * cos(theta_rad);
        Tension = M_weight / L;
    }

    // Actualizar resultados (convertir a kN para legibilidad)
    frOut.html((F_R / 1000).toFixed(2));
    cpOut.html(F_R > 0 ? s_cp.toFixed(2) : "0.00");
    tOut.html((Tension / 1000).toFixed(2));

    // 3. Representación Gráfica
    // Escalar la física (metros) a los píxeles del canvas de forma responsiva
    let scaleFactor = min(width, height) / 6.5; // Espacio lógico de aprox 6.5m
    let originX = width * 0.15;
    let originY = height * 0.85; // El suelo (y=0)

    function physToCanvas(px, py) {
        return {
            x: originX + px * scaleFactor,
            y: originY - py * scaleFactor
        };
    }

    push();
    
    // Dibujar suelo y pared
    stroke(100);
    strokeWeight(4);
    let ptPared = physToCanvas(0, y_hinge + 1);
    let ptSuelo = physToCanvas(5, 0);
    line(originX, ptPared.y, originX, originY); // Pared
    line(originX, originY, ptSuelo.x, originY); // Suelo

    // Dibujar Agua
    if (h > 0) {
        noStroke();
        fill(52, 152, 219, 150);
        let w_top = physToCanvas(0, h);
        let w_bottom = physToCanvas(4.5, 0);
        rect(w_top.x, w_top.y, w_bottom.x - w_top.x, originY - w_top.y);
        
        // Triángulo de superficie
        stroke(52, 152, 219);
        strokeWeight(1);
        line(w_top.x + 20, w_top.y, w_top.x + 40, w_top.y);
        line(w_top.x + 25, w_top.y + 5, w_top.x + 35, w_top.y + 5);
        line(w_top.x + 29, w_top.y + 10, w_top.x + 31, w_top.y + 10);
    }

    // Coordenadas de la compuerta
    let hinge = physToCanvas(0, y_hinge);
    let gate_end_x = L * cos(theta_rad);
    let gate_end_y = y_hinge - L * sin(theta_rad);
    let end = physToCanvas(gate_end_x, gate_end_y);

    // Representación 3D del ancho 'b' de la compuerta
    // Desplazamiento isométrico basado en 'b'
    let b_offset_x = b * 20; 
    let b_offset_y = -b * 10;
    
    fill(180);
    stroke(100);
    strokeWeight(1);
    // Dibujar la cara trasera (perspectiva)
    quad(
        hinge.x, hinge.y,
        end.x, end.y,
        end.x + b_offset_x, end.y + b_offset_y,
        hinge.x + b_offset_x, hinge.y + b_offset_y
    );

    // Dibujar la compuerta frontal principal (gruesa)
    stroke(50);
    strokeWeight(6);
    line(hinge.x, hinge.y, end.x, end.y);

    // Dibujar Bisagra
    fill(255, 50, 50);
    noStroke();
    circle(hinge.x, hinge.y, 12);

    // Dibujar Cable (Perpendicular)
    stroke(150, 150, 150);
    strokeWeight(3);
    let cable_length_px = 60;
    let cable_angle = -theta_rad - PI/2; // Perpendicular
    let cx = end.x + cable_length_px * cos(cable_angle);
    let cy = end.y + cable_length_px * sin(cable_angle);
    line(end.x, end.y, cx, cy);

    // Dibujar Fuerza Resultante
    if (F_R > 0) {
        let cp_x = s_cp * cos(theta_rad);
        let cp_y = y_hinge - s_cp * sin(theta_rad);
        let cp_canvas = physToCanvas(cp_x, cp_y);

        let force_scale = map(F_R, 0, 150000, 20, 100); // Escala visual de la flecha
        force_scale = constrain(force_scale, 20, 120);

        stroke(231, 76, 60);
        strokeWeight(3);
        fill(231, 76, 60);
        
        let fx = cp_canvas.x - force_scale * cos(cable_angle + PI);
        let fy = cp_canvas.y - force_scale * sin(cable_angle + PI);
        
        // Dibujar flecha
        line(fx, fy, cp_canvas.x, cp_canvas.y);
        push();
        translate(cp_canvas.x, cp_canvas.y);
        rotate(cable_angle);
        triangle(0, 0, -10, -5, -10, 5); // Punta de la flecha
        pop();

        // Texto F_R
        noStroke();
        textSize(14);
        textAlign(RIGHT, BOTTOM);
        text("F_R", fx - 5, fy - 5);
    }
    pop();
}

// Escuchar cambios de tamaño de ventana para ajustar el canvas (Responsive)
function windowResized() {
    let canvasContainer = select('#canvas-container');
    resizeCanvas(canvasContainer.width, canvasContainer.height);
}
