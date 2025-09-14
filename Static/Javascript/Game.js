import { ClientService } from './Services/Client.js';
import { DebugService } from './Services/Debug.js';

kaplay({
    ...create("16:9"),
    crisp: true,
    background: [0, 255, 0],
    canvas: document.getElementById("KaplayCanvas"),
    letterBox: true,
    maxFPS: 60,
});

DebugService.ErudaConsole();
ClientService.Testing();