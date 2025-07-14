// Paso 1: Configuración
console.log("== GESTIÓN DE DATOS CON OBJETOS, SETS Y MAPS ==");

// Paso 2: Creación del objeto con productos
const productos = {
    1: { id: 1, nombre: "Teclado", precio: 50000 },
    2: { id: 2, nombre: "Mouse", precio: 30000 },
    3: { id: 3, nombre: "Monitor", precio: 450000 }
};

// Mostrar productos originales
console.log("\n Productos (Objeto):");
for (let key in productos) {
    console.log(`ID: ${productos[key].id}, Nombre: ${productos[key].nombre}, Precio: ${productos[key].precio}`);
}

// Paso 3: Conversión a Set para eliminar duplicados
const productosArray = Object.values(productos); // Convertimos el objeto en array
const productosSet = new Set(productosArray); // Creamos un Set

console.log("\n Productos únicos (Set):");
for (const producto of productosSet) {
    console.log(`Nombre: ${producto.nombre}, Precio: ${producto.precio}`);
}

// Paso 4: Creación de un Map asociando categoría -> nombre del producto
const productosMap = new Map();
productosMap.set("Periféricos", "Teclado");
productosMap.set("Accesorios", "Mouse");
productosMap.set("Pantallas", "Monitor");

console.log("\n Categorías y productos (Map):");
productosMap.forEach((producto, categoria) => {
    console.log(`Categoría: ${categoria}, Producto: ${producto}`);
});

// Paso 5.1: Recorrer el objeto productos con for...in
console.log("\n Recorrido con for...in (Objeto):");
for (let clave in productos) {
    const p = productos[clave];
    console.log(`Producto ID ${p.id}: ${p.nombre} - $${p.precio}`);
}

// Paso 5.2: Recorrer el Set con for...of
console.log("\n Recorrido con for...of (Set):");
for (const prod of productosSet) {
    console.log(`Producto: ${prod.nombre} - Precio: $${prod.precio}`);
}

// Paso 5.3: Recorrer el Map con forEach
console.log("\n Recorrido con forEach (Map):");
productosMap.forEach((producto, categoria) => {
    console.log(`En la categoría "${categoria}" está el producto "${producto}".`);
});

// Paso 6: Validaciones
console.log("\n Validación de duplicados y datos completos:");
const ids = new Set();
let datosCompletos = true;

productosArray.forEach(p => {
    if (ids.has(p.id)) {
        console.warn(` Producto duplicado con ID: ${p.id}`);
    } else {
        ids.add(p.id);
    }

    if (!p.id || !p.nombre || !p.precio) {
        console.warn(` Producto con datos incompletos:`, p);
        datosCompletos = false;
    }
});

if (datosCompletos) {
    console.log(" Todos los productos tienen datos completos.");
}

// Paso 7: El código puede ejecutarse en la consola del navegador
console.log("\n✅ PROGRAMA FINALIZADO CORRECTAMENTE");
