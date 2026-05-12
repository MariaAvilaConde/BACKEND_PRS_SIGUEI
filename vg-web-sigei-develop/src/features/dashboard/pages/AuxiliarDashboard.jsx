import { motion } from "framer-motion";
import { ClipboardList, Bell, GraduationCap } from "lucide-react";
import StatCard from "../components/StatCard";

export default function AuxiliarDashboard() {
     return (
          <div>
               <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
               >
                    <h1 className="text-2xl font-bold text-gray-800">Panel Auxiliar</h1>
                    <p className="text-gray-500 text-sm mt-1">Control de asistencia e incidencias</p>
               </motion.div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <StatCard icon={ClipboardList} label="Asistencia" value="--" color="blue" delay={0.1} />
                    <StatCard icon={Bell} label="Incidencias" value="--" color="red" delay={0.2} />
                    <StatCard icon={GraduationCap} label="Estudiantes" value="--" color="green" delay={0.3} />
               </div>

               <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
               >
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Bienvenido</h2>
                    <p className="text-gray-500 text-sm">
                         Gestiona la asistencia diaria y registra incidencias de los estudiantes.
                    </p>
               </motion.div>
          </div>
     );
}
