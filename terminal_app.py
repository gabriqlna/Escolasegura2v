"""
Sistema de Segurança Escolar - Versão Terminal
Aplicativo simplificado para funcionar no ambiente Replit
"""

import os
import json
from datetime import datetime
# Firebase removido temporariamente devido a problemas de compatibilidade

class FirebaseManager:
    """Gerenciador do Firebase para autenticação e banco de dados"""
    
    def __init__(self):
        self.config = {
            "apiKey": os.environ.get("FIREBASE_API_KEY", "demo-key"),
            "authDomain": f"{os.environ.get('FIREBASE_PROJECT_ID', 'demo-project')}.firebaseapp.com",
            "projectId": os.environ.get("FIREBASE_PROJECT_ID", "demo-project"),
            "storageBucket": f"{os.environ.get('FIREBASE_PROJECT_ID', 'demo-project')}.firebasestorage.app",
            "messagingSenderId": "123456789",
            "appId": os.environ.get("FIREBASE_APP_ID", "demo-app-id"),
            "databaseURL": f"https://{os.environ.get('FIREBASE_PROJECT_ID', 'demo-project')}-default-rtdb.firebaseio.com/"
        }
        
        self.firebase = None
        self.auth = None
        self.db = None
        self.current_user = None
        
        self.initialize_firebase()
    
    def initialize_firebase(self):
        """Inicializa o Firebase"""
        try:
            # Para demonstração, usar dados locais
            print("🔧 Inicializando Firebase...")
            print("🔧 Modo demonstração - Firebase não configurado")
            self.auth = None
            self.db = None
            
        except Exception as e:
            print(f"⚠️  Erro ao inicializar Firebase: {e}")
    
    def sign_in(self, email, password):
        """Fazer login (modo demonstração)"""
        try:
            # Login fake para demonstração
            if email == "admin@escola.com" and password == "admin123":
                self.current_user = {
                    'email': email,
                    'name': 'Administrador',
                    'user_type': 'direcao',
                    'active': True
                }
                return {'success': True, 'user': {'localId': 'admin123'}, 'user_data': self.current_user}
            elif email == "aluno@escola.com" and password == "123456":
                self.current_user = {
                    'email': email,
                    'name': 'Aluno Exemplo',
                    'user_type': 'aluno',
                    'active': True
                }
                return {'success': True, 'user': {'localId': 'aluno123'}, 'user_data': self.current_user}
            else:
                return {'success': False, 'error': 'Credenciais inválidas'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_current_user(self):
        """Obter usuário atual"""
        return self.current_user
    
    def has_permission(self, permission):
        """Verificar permissões do usuário"""
        if not self.current_user:
            return False
            
        user_type = self.current_user.get('user_type', 'aluno')
        
        permissions = {
            'aluno': ['denunciar', 'ver_avisos', 'emergencia', 'ver_campanhas'],
            'funcionario': ['denunciar', 'ver_avisos', 'emergencia', 'ver_campanhas', 
                          'registrar_visitantes', 'adicionar_ocorrencias'],
            'direcao': ['denunciar', 'ver_avisos', 'emergencia', 'ver_campanhas',
                       'registrar_visitantes', 'adicionar_ocorrencias', 'criar_avisos',
                       'ver_denuncias', 'cadastrar_campanhas', 'banir_usuarios', 'gerar_relatorios']
        }
        
        return permission in permissions.get(user_type, [])

# Instância global do Firebase
firebase_manager = FirebaseManager()

class SchoolSecurityTerminalApp:
    """Aplicativo Principal em modo Terminal"""
    
    def __init__(self):
        self.running = True
        
    def clear_screen(self):
        """Limpar tela"""
        os.system('clear' if os.name == 'posix' else 'cls')
    
    def print_header(self):
        """Imprimir cabeçalho"""
        print("=" * 60)
        print("🏫 SISTEMA DE SEGURANÇA ESCOLAR")
        print("=" * 60)
        user = firebase_manager.get_current_user()
        if user:
            print(f"👤 Usuário: {user['name']} ({user['user_type']})")
        print("=" * 60)
    
    def login_screen(self):
        """Tela de login"""
        self.clear_screen()
        self.print_header()
        print("\n🔐 LOGIN")
        print("-" * 20)
        
        print("\n📋 Contas de demonstração:")
        print("   Admin: admin@escola.com / admin123")
        print("   Aluno: aluno@escola.com / 123456")
        
        print("\n")
        email = input("📧 Email: ").strip()
        password = input("🔒 Senha: ").strip()
        
        if not email or not password:
            print("\n❌ Por favor, preencha todos os campos")
            input("\nPressione Enter para continuar...")
            return False
        
        result = firebase_manager.sign_in(email, password)
        
        if result['success']:
            print("\n✅ Login realizado com sucesso!")
            input("\nPressione Enter para continuar...")
            return True
        else:
            print(f"\n❌ Erro no login: {result['error']}")
            input("\nPressione Enter para continuar...")
            return False
    
    def main_menu(self):
        """Menu principal"""
        while True:
            self.clear_screen()
            self.print_header()
            
            print("\n📋 MENU PRINCIPAL")
            print("-" * 20)
            
            options = []
            
            # Opções sempre disponíveis
            options.append(("🚨 Emergência", self.emergency_menu))
            
            if firebase_manager.has_permission('denunciar'):
                options.append(("📝 Nova Denúncia", self.report_incident))
            
            if firebase_manager.has_permission('ver_avisos'):
                options.append(("📢 Ver Avisos", self.view_notices))
            
            if firebase_manager.has_permission('registrar_visitantes'):
                options.append(("👥 Registrar Visitante", self.register_visitor))
            
            if firebase_manager.has_permission('ver_denuncias'):
                options.append(("📊 Ver Denúncias", self.view_reports))
            
            if firebase_manager.has_permission('gerar_relatorios'):
                options.append(("📈 Relatórios", self.generate_reports))
            
            # Opção de sair
            options.append(("🚪 Logout", None))
            
            # Mostrar opções
            for i, (text, _) in enumerate(options, 1):
                print(f"{i}. {text}")
            
            print("\n")
            try:
                choice = int(input("Escolha uma opção: "))
                if 1 <= choice <= len(options):
                    if choice == len(options):  # Logout
                        print("\n👋 Fazendo logout...")
                        return
                    else:
                        options[choice-1][1]()  # Chamar função
                else:
                    print("\n❌ Opção inválida!")
                    input("Pressione Enter para continuar...")
            except ValueError:
                print("\n❌ Por favor, digite um número válido!")
                input("Pressione Enter para continuar...")
    
    def emergency_menu(self):
        """Menu de emergência"""
        self.clear_screen()
        self.print_header()
        
        print("\n🚨 EMERGÊNCIA")
        print("-" * 20)
        print("⚠️  ATENÇÃO: Este é um sistema de demonstração!")
        print("⚠️  Em emergência real, contate imediatamente:")
        print("   📞 Polícia: 190")
        print("   🚑 SAMU: 192")
        print("   🚒 Bombeiros: 193")
        
        print("\n📋 Tipos de emergência:")
        print("1. 🔥 Incêndio")
        print("2. 🩸 Acidente/Ferimento")
        print("3. 🔫 Ameaça/Violência")
        print("4. 💊 Emergência Médica")
        print("5. 🌪️  Desastre Natural")
        print("6. ⬅️  Voltar")
        
        print("\n")
        try:
            choice = int(input("Tipo de emergência: "))
            if 1 <= choice <= 5:
                print(f"\n🚨 Emergência registrada: Tipo {choice}")
                print("✅ Notificações enviadas para:")
                print("   - Direção da escola")
                print("   - Equipe de segurança")
                print("   - Autoridades locais")
                print("\n⏰ Aguarde instruções!")
            elif choice == 6:
                return
            else:
                print("❌ Opção inválida!")
        except ValueError:
            print("❌ Por favor, digite um número válido!")
        
        input("\nPressione Enter para voltar ao menu...")
    
    def report_incident(self):
        """Reportar incidente/denúncia"""
        self.clear_screen()
        self.print_header()
        
        print("\n📝 NOVA DENÚNCIA")
        print("-" * 20)
        
        print("\n📋 Tipo de ocorrência:")
        print("1. 🤜 Bullying/Agressão")
        print("2. 💊 Uso de substâncias")
        print("3. 📱 Cyberbullying")
        print("4. 🔫 Porte de armas")
        print("5. 🚫 Vandalismo")
        print("6. 👤 Comportamento suspeito")
        print("7. ℹ️  Outro")
        
        try:
            incident_type = int(input("\nTipo: "))
            location = input("📍 Local: ").strip()
            description = input("📄 Descrição: ").strip()
            anonymous = input("🕵️  Denúncia anônima? (s/N): ").strip().lower() == 's'
            
            print(f"\n✅ Denúncia registrada!")
            print(f"   📅 Data: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
            print(f"   📍 Local: {location}")
            print(f"   🕵️  Anônima: {'Sim' if anonymous else 'Não'}")
            print(f"   🆔 Protocolo: #{datetime.now().strftime('%Y%m%d%H%M%S')}")
            
        except ValueError:
            print("❌ Entrada inválida!")
        
        input("\nPressione Enter para voltar ao menu...")
    
    def view_notices(self):
        """Ver avisos"""
        self.clear_screen()
        self.print_header()
        
        print("\n📢 AVISOS")
        print("-" * 20)
        
        # Avisos de exemplo
        notices = [
            {
                'title': 'Simulado de Evacuação',
                'content': 'Simulado de evacuação será realizado na próxima quinta-feira às 10h.',
                'date': '2025-09-18',
                'priority': 'Alta'
            },
            {
                'title': 'Portões de Entrada',
                'content': 'Novos horários de funcionamento dos portões: 7h às 18h.',
                'date': '2025-09-15',
                'priority': 'Média'
            },
            {
                'title': 'Visitantes',
                'content': 'Todos os visitantes devem se cadastrar na recepção.',
                'date': '2025-09-10',
                'priority': 'Baixa'
            }
        ]
        
        for i, notice in enumerate(notices, 1):
            priority_emoji = {"Alta": "🔴", "Média": "🟡", "Baixa": "🟢"}
            print(f"\n{i}. {priority_emoji[notice['priority']]} {notice['title']}")
            print(f"   📅 {notice['date']}")
            print(f"   📄 {notice['content']}")
        
        input("\nPressione Enter para voltar ao menu...")
    
    def register_visitor(self):
        """Registrar visitante"""
        self.clear_screen()
        self.print_header()
        
        print("\n👥 REGISTRAR VISITANTE")
        print("-" * 25)
        
        name = input("👤 Nome: ").strip()
        document = input("🆔 RG/CPF: ").strip()
        purpose = input("🎯 Motivo da visita: ").strip()
        contact = input("📞 Contato: ").strip()
        
        if name and document and purpose:
            visitor_id = f"V{datetime.now().strftime('%Y%m%d%H%M%S')}"
            print(f"\n✅ Visitante registrado!")
            print(f"   🆔 ID: {visitor_id}")
            print(f"   👤 Nome: {name}")
            print(f"   📅 Entrada: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
            print(f"   🎯 Motivo: {purpose}")
        else:
            print("\n❌ Informações incompletas!")
        
        input("\nPressione Enter para voltar ao menu...")
    
    def view_reports(self):
        """Ver denúncias (apenas direção)"""
        self.clear_screen()
        self.print_header()
        
        print("\n📊 DENÚNCIAS RECEBIDAS")
        print("-" * 25)
        
        reports = [
            {
                'id': '#202509201001',
                'type': 'Bullying/Agressão',
                'location': 'Pátio',
                'date': '2025-09-20 10:15',
                'status': 'Em análise',
                'anonymous': True
            },
            {
                'id': '#202509190815',
                'type': 'Comportamento suspeito',
                'location': 'Portão principal',
                'date': '2025-09-19 08:30',
                'status': 'Resolvido',
                'anonymous': False
            }
        ]
        
        for report in reports:
            status_emoji = {"Em análise": "🔄", "Resolvido": "✅", "Pendente": "⏳"}
            print(f"\n🆔 {report['id']}")
            print(f"   📝 Tipo: {report['type']}")
            print(f"   📍 Local: {report['location']}")
            print(f"   📅 Data: {report['date']}")
            print(f"   {status_emoji[report['status']]} Status: {report['status']}")
            print(f"   🕵️  Anônima: {'Sim' if report['anonymous'] else 'Não'}")
        
        input("\nPressione Enter para voltar ao menu...")
    
    def generate_reports(self):
        """Gerar relatórios"""
        self.clear_screen()
        self.print_header()
        
        print("\n📈 RELATÓRIOS")
        print("-" * 15)
        
        print("\n📊 Estatísticas do mês:")
        print("   📝 Total de denúncias: 15")
        print("   🚨 Emergências: 2")
        print("   👥 Visitantes registrados: 47")
        print("   🔄 Casos em análise: 3")
        print("   ✅ Casos resolvidos: 12")
        
        print("\n📋 Tipos de incidentes mais comuns:")
        print("   1. 🤜 Bullying/Agressão (40%)")
        print("   2. 👤 Comportamento suspeito (25%)")
        print("   3. 🚫 Vandalismo (20%)")
        print("   4. 📱 Cyberbullying (15%)")
        
        input("\nPressione Enter para voltar ao menu...")
    
    def run(self):
        """Executar aplicativo"""
        print("🚀 Iniciando Sistema de Segurança Escolar...")
        print("⏳ Aguarde...")
        
        while self.running:
            if not firebase_manager.get_current_user():
                if not self.login_screen():
                    continue
            
            self.main_menu()
            firebase_manager.current_user = None

if __name__ == '__main__':
    app = SchoolSecurityTerminalApp()
    app.run()