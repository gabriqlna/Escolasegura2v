"""
Sistema de Segurança Escolar - Versão Android
Aplicativo desenvolvido em Python + Kivy para dispositivos móveis Android
"""

import os
from datetime import datetime
import json

# Configurações básicas para Android - imports opcionais para compatibilidade
try:
    from kivy.config import Config
    Config.set('graphics', 'resizable', False)
    Config.set('graphics', 'width', '360')
    Config.set('graphics', 'height', '640')

    from kivy.app import App
    from kivy.uix.screenmanager import ScreenManager, Screen
    from kivy.uix.boxlayout import BoxLayout
    from kivy.uix.label import Label
    from kivy.uix.button import Button
    from kivy.uix.textinput import TextInput
    from kivy.uix.spinner import Spinner
    from kivy.uix.popup import Popup
    from kivy.clock import Clock

    from kivymd.app import MDApp
    from kivymd.uix.screen import MDScreen
    from kivymd.uix.boxlayout import MDBoxLayout
    from kivymd.uix.button import MDRaisedButton, MDIconButton, MDFlatButton
    from kivymd.uix.textfield import MDTextField
    from kivymd.uix.card import MDCard
    from kivymd.uix.list import MDList, OneLineListItem
    from kivymd.uix.label import MDLabel
    from kivymd.uix.toolbar import MDTopAppBar
    from kivymd.uix.dialog import MDDialog
    
    KIVY_AVAILABLE = True
except ImportError:
    # Fallbacks para quando Kivy não está disponível (ex: Replit)
    Config = None
    App = object
    ScreenManager = Screen = BoxLayout = Label = Button = object
    TextInput = Spinner = Popup = Clock = object
    MDApp = MDScreen = MDBoxLayout = object
    MDRaisedButton = MDIconButton = MDFlatButton = object
    MDTextField = MDCard = MDList = OneLineListItem = object
    MDLabel = MDTopAppBar = MDDialog = object
    
    KIVY_AVAILABLE = False


class LocalDataManager:
    """Gerenciador de dados locais (substituto temporário do Firebase)"""
    
    def __init__(self):
        self.current_user = None
        self.data_file = "local_data.json"
        self.load_data()
    
    def load_data(self):
        """Carregar dados do arquivo local"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r') as f:
                    self.data = json.load(f)
            else:
                self.data = {
                    'users': {
                        'admin@escola.com': {
                            'password': 'admin123',
                            'name': 'Administrador',
                            'user_type': 'direcao',
                            'active': True
                        },
                        'aluno@escola.com': {
                            'password': '123456',
                            'name': 'Aluno Exemplo',
                            'user_type': 'aluno',
                            'active': True
                        },
                        'funcionario@escola.com': {
                            'password': 'func123',
                            'name': 'Funcionário Exemplo',
                            'user_type': 'funcionario',
                            'active': True
                        }
                    },
                    'reports': [],
                    'notices': [
                        {
                            'title': 'Simulado de Evacuação',
                            'content': 'Simulado será realizado na próxima quinta-feira às 10h.',
                            'date': '2025-09-20',
                            'priority': 'Alta'
                        },
                        {
                            'title': 'Novos Horários',
                            'content': 'Portões funcionam de 7h às 18h.',
                            'date': '2025-09-18',
                            'priority': 'Média'
                        }
                    ],
                    'visitors': [],
                    'incidents': []
                }
                self.save_data()
        except Exception as e:
            print(f"Erro ao carregar dados: {e}")
    
    def save_data(self):
        """Salvar dados no arquivo local"""
        try:
            with open(self.data_file, 'w') as f:
                json.dump(self.data, f, indent=2, default=str)
        except Exception as e:
            print(f"Erro ao salvar dados: {e}")
    
    def sign_in(self, email, password):
        """Fazer login"""
        try:
            if email in self.data['users']:
                user = self.data['users'][email]
                if user['password'] == password and user.get('active', True):
                    self.current_user = {
                        'email': email,
                        'name': user['name'],
                        'user_type': user['user_type'],
                        'active': user['active']
                    }
                    return {'success': True, 'user_data': self.current_user}
                else:
                    return {'success': False, 'error': 'Credenciais inválidas ou usuário inativo'}
            else:
                return {'success': False, 'error': 'Usuário não encontrado'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def sign_up(self, email, password, user_data):
        """Cadastrar novo usuário"""
        try:
            if email not in self.data['users']:
                self.data['users'][email] = {
                    'password': password,
                    'name': user_data.get('name', ''),
                    'user_type': user_data.get('user_type', 'aluno'),
                    'active': True,
                    'created_at': datetime.now().isoformat()
                }
                self.save_data()
                return {'success': True}
            else:
                return {'success': False, 'error': 'Usuário já existe'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_current_user(self):
        """Obter usuário atual"""
        return self.current_user
    
    def sign_out(self):
        """Fazer logout"""
        self.current_user = None
    
    def has_permission(self, permission):
        """Verificar permissões do usuário"""
        if not self.current_user:
            return False
            
        user_type = self.current_user.get('user_type', 'aluno')
        
        permissions = {
            'aluno': ['denunciar', 'ver_avisos', 'emergencia'],
            'funcionario': ['denunciar', 'ver_avisos', 'emergencia', 'registrar_visitantes', 'adicionar_ocorrencias'],
            'direcao': ['denunciar', 'ver_avisos', 'emergencia', 'registrar_visitantes', 
                       'adicionar_ocorrencias', 'criar_avisos', 'ver_denuncias', 'gerar_relatorios']
        }
        
        return permission in permissions.get(user_type, [])
    
    def add_report(self, report_data):
        """Adicionar denúncia"""
        try:
            report_data['id'] = f"R{datetime.now().strftime('%Y%m%d%H%M%S')}"
            report_data['date'] = datetime.now().isoformat()
            report_data['status'] = 'Pendente'
            self.data['reports'].append(report_data)
            self.save_data()
            return True
        except Exception as e:
            print(f"Erro ao adicionar denúncia: {e}")
            return False
    
    def get_reports(self):
        """Obter denúncias"""
        return self.data.get('reports', [])
    
    def get_notices(self):
        """Obter avisos"""
        return self.data.get('notices', [])


# Instância global do gerenciador de dados
data_manager = LocalDataManager()


class LoginScreen(MDScreen):
    """Tela de Login"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'login'
        
        # Layout principal
        main_layout = MDBoxLayout(orientation='vertical', padding=20, spacing=20)
        
        # Logo/Título
        title = MDLabel(
            text='🏫 Sistema de Segurança Escolar',
            halign='center',
            theme_text_color='Primary',
            font_style='H5',
            size_hint_y=None,
            height='80dp'
        )
        main_layout.add_widget(title)
        
        # Card de login
        login_card = MDCard(
            orientation='vertical',
            padding=20,
            spacing=15,
            size_hint=(0.9, None),
            height='350dp',
            pos_hint={'center_x': 0.5},
            elevation=5
        )
        
        # Campos de login
        self.email_field = MDTextField(
            hint_text='Email',
            helper_text='Digite seu email',
            helper_text_mode='persistent',
            size_hint_y=None,
            height='60dp'
        )
        
        self.password_field = MDTextField(
            hint_text='Senha',
            helper_text='Digite sua senha',
            helper_text_mode='persistent',
            password=True,
            size_hint_y=None,
            height='60dp'
        )
        
        # Botões
        login_btn = MDRaisedButton(
            text='ENTRAR',
            size_hint_y=None,
            height='50dp',
            on_release=self.login,
            pos_hint={'center_x': 0.5}
        )
        
        register_btn = MDFlatButton(
            text='CRIAR CONTA',
            size_hint_y=None,
            height='40dp',
            on_release=self.show_register_form,
            pos_hint={'center_x': 0.5}
        )
        
        # Status label
        self.status_label = MDLabel(
            text='Contas de teste:\nadmin@escola.com / admin123\naluno@escola.com / 123456',
            halign='center',
            theme_text_color='Hint',
            size_hint_y=None,
            height='60dp'
        )
        
        login_card.add_widget(self.email_field)
        login_card.add_widget(self.password_field)
        login_card.add_widget(login_btn)
        login_card.add_widget(register_btn)
        login_card.add_widget(self.status_label)
        
        main_layout.add_widget(login_card)
        self.add_widget(main_layout)
    
    def login(self, *args):
        """Realizar login"""
        email = self.email_field.text.strip()
        password = self.password_field.text
        
        if not email or not password:
            self.show_message('Por favor, preencha todos os campos')
            return
        
        result = data_manager.sign_in(email, password)
        
        if result['success']:
            self.show_message('Login realizado com sucesso!', is_error=False)
            Clock.schedule_once(lambda dt: setattr(self.manager, 'current', 'dashboard'), 1)
        else:
            self.show_message(f'Erro: {result["error"]}')
    
    def show_register_form(self, *args):
        """Mostrar tela de cadastro"""
        self.manager.current = 'register'
    
    def show_message(self, message, is_error=True):
        """Mostrar mensagem de status"""
        self.status_label.text = message
        if is_error:
            self.status_label.theme_text_color = 'Error'
        else:
            self.status_label.theme_text_color = 'Primary'


class RegisterScreen(MDScreen):
    """Tela de Cadastro"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'register'
        
        main_layout = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        # Título
        title = MDLabel(
            text='Criar Nova Conta',
            halign='center',
            theme_text_color='Primary',
            font_style='H6',
            size_hint_y=None,
            height='50dp'
        )
        main_layout.add_widget(title)
        
        # Campos
        self.name_field = MDTextField(hint_text='Nome Completo', size_hint_y=None, height='60dp')
        self.email_field = MDTextField(hint_text='Email', size_hint_y=None, height='60dp')
        self.password_field = MDTextField(hint_text='Senha', password=True, size_hint_y=None, height='60dp')
        self.confirm_password_field = MDTextField(hint_text='Confirmar Senha', password=True, size_hint_y=None, height='60dp')
        
        # Tipo de usuário
        self.user_type_spinner = Spinner(
            text='Tipo: Aluno',
            values=['Tipo: Aluno', 'Tipo: Funcionário', 'Tipo: Direção'],
            size_hint_y=None,
            height='50dp'
        )
        
        # Botões
        register_btn = MDRaisedButton(
            text='CADASTRAR',
            size_hint_y=None,
            height='50dp',
            on_release=self.register,
            pos_hint={'center_x': 0.5}
        )
        
        back_btn = MDFlatButton(
            text='VOLTAR',
            size_hint_y=None,
            height='40dp',
            on_release=self.go_back,
            pos_hint={'center_x': 0.5}
        )
        
        self.status_label = MDLabel(
            text='',
            halign='center',
            theme_text_color='Error',
            size_hint_y=None,
            height='40dp'
        )
        
        main_layout.add_widget(self.name_field)
        main_layout.add_widget(self.email_field)
        main_layout.add_widget(self.password_field)
        main_layout.add_widget(self.confirm_password_field)
        main_layout.add_widget(self.user_type_spinner)
        main_layout.add_widget(register_btn)
        main_layout.add_widget(back_btn)
        main_layout.add_widget(self.status_label)
        
        self.add_widget(main_layout)
    
    def register(self, *args):
        """Realizar cadastro"""
        name = self.name_field.text.strip()
        email = self.email_field.text.strip()
        password = self.password_field.text
        confirm_password = self.confirm_password_field.text
        
        if not all([name, email, password, confirm_password]):
            self.show_message('Preencha todos os campos')
            return
        
        if password != confirm_password:
            self.show_message('Senhas não coincidem')
            return
        
        # Mapear tipo de usuário
        user_type_map = {
            'Tipo: Aluno': 'aluno',
            'Tipo: Funcionário': 'funcionario',
            'Tipo: Direção': 'direcao'
        }
        user_type = user_type_map.get(self.user_type_spinner.text, 'aluno')
        
        user_data = {'name': name, 'user_type': user_type}
        result = data_manager.sign_up(email, password, user_data)
        
        if result['success']:
            self.show_message('Cadastro realizado com sucesso!', is_error=False)
            Clock.schedule_once(lambda dt: setattr(self.manager, 'current', 'login'), 2)
        else:
            self.show_message(f'Erro: {result["error"]}')
    
    def go_back(self, *args):
        """Voltar para login"""
        self.manager.current = 'login'
    
    def show_message(self, message, is_error=True):
        """Mostrar mensagem"""
        self.status_label.text = message
        if is_error:
            self.status_label.theme_text_color = 'Error'
        else:
            self.status_label.theme_text_color = 'Primary'


class DashboardScreen(MDScreen):
    """Dashboard Principal"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'dashboard'
        
        main_layout = MDBoxLayout(orientation='vertical')
        
        # Toolbar
        toolbar = MDTopAppBar(
            title="Segurança Escolar",
            right_action_items=[["logout", lambda x: self.logout()]]
        )
        main_layout.add_widget(toolbar)
        
        # Scroll view com cards
        scroll_content = MDBoxLayout(orientation='vertical', spacing=10, padding=10)
        scroll_content.bind(minimum_height=scroll_content.setter('height'))
        
        user = data_manager.get_current_user()
        if user:
            # Welcome card
            welcome_card = self.create_info_card(f"Bem-vindo, {user['name']}", f"Tipo: {user['user_type'].title()}")
            scroll_content.add_widget(welcome_card)
        
        # Emergency button (always visible)
        emergency_card = self.create_action_card("🚨 EMERGÊNCIA", "Acionar em caso de emergência", self.emergency_action)
        scroll_content.add_widget(emergency_card)
        
        # Permission-based cards
        if data_manager.has_permission('denunciar'):
            report_card = self.create_action_card("📝 Denúncias", "Fazer nova denúncia", self.open_reports)
            scroll_content.add_widget(report_card)
        
        if data_manager.has_permission('ver_avisos'):
            notices_card = self.create_action_card("📢 Avisos", "Ver avisos da escola", self.open_notices)
            scroll_content.add_widget(notices_card)
        
        if data_manager.has_permission('registrar_visitantes'):
            visitors_card = self.create_action_card("👥 Visitantes", "Registrar visitante", self.open_visitors)
            scroll_content.add_widget(visitors_card)
        
        if data_manager.has_permission('ver_denuncias'):
            admin_card = self.create_action_card("📊 Relatórios", "Ver denúncias e relatórios", self.open_admin)
            scroll_content.add_widget(admin_card)
        
        try:
            from kivy.uix.scrollview import ScrollView
        except ImportError:
            ScrollView = object
        scroll = ScrollView()
        scroll.add_widget(scroll_content)
        main_layout.add_widget(scroll)
        
        self.add_widget(main_layout)
    
    def create_info_card(self, title, subtitle):
        """Criar card informativo"""
        card = MDCard(
            MDBoxLayout(
                MDLabel(text=title, font_style="H6", size_hint_y=None, height='30dp'),
                MDLabel(text=subtitle, theme_text_color="Hint", size_hint_y=None, height='25dp'),
                orientation='vertical',
                padding=15,
                spacing=5
            ),
            size_hint_y=None,
            height='80dp',
            elevation=2
        )
        return card
    
    def create_action_card(self, title, subtitle, action):
        """Criar card de ação"""
        card = MDCard(
            MDBoxLayout(
                MDBoxLayout(
                    MDLabel(text=title, font_style="H6", size_hint_y=None, height='30dp'),
                    MDLabel(text=subtitle, theme_text_color="Hint", size_hint_y=None, height='25dp'),
                    orientation='vertical',
                    size_hint_x=0.7
                ),
                MDRaisedButton(
                    text="ABRIR",
                    size_hint_x=0.3,
                    size_hint_y=None,
                    height='40dp',
                    on_release=action
                ),
                padding=15,
                spacing=10
            ),
            size_hint_y=None,
            height='80dp',
            elevation=2
        )
        return card
    
    def emergency_action(self, *args):
        """Ação de emergência"""
        dialog = MDDialog(
            title="🚨 EMERGÊNCIA ACIONADA",
            text="Emergência foi registrada!\n\nEm situação real:\n• Polícia: 190\n• SAMU: 192\n• Bombeiros: 193",
            buttons=[MDFlatButton(text="OK", on_release=lambda x: dialog.dismiss())]
        )
        dialog.open()
    
    def open_reports(self, *args):
        """Abrir tela de denúncias"""
        self.manager.current = 'reports'
    
    def open_notices(self, *args):
        """Abrir avisos"""
        self.manager.current = 'notices'
    
    def open_visitors(self, *args):
        """Abrir visitantes"""
        self.manager.current = 'visitors'
    
    def open_admin(self, *args):
        """Abrir área administrativa"""
        self.manager.current = 'admin'
    
    def logout(self, *args):
        """Fazer logout"""
        data_manager.sign_out()
        self.manager.current = 'login'


class ReportsScreen(MDScreen):
    """Tela de Denúncias"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'reports'
        
        main_layout = MDBoxLayout(orientation='vertical')
        
        # Toolbar
        toolbar = MDTopAppBar(
            title="Nova Denúncia",
            left_action_items=[["arrow-left", lambda x: setattr(self.manager, 'current', 'dashboard')]]
        )
        main_layout.add_widget(toolbar)
        
        # Form
        form_layout = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        self.incident_type = Spinner(
            text='Tipo de Incidente',
            values=['Bullying', 'Drogas', 'Vandalismo', 'Ameaça', 'Outro'],
            size_hint_y=None,
            height='50dp'
        )
        
        self.location_field = MDTextField(
            hint_text='Local do incidente',
            size_hint_y=None,
            height='60dp'
        )
        
        self.description_field = MDTextField(
            hint_text='Descrição detalhada',
            multiline=True,
            size_hint_y=None,
            height='100dp'
        )
        
        self.anonymous_checkbox = BoxLayout(size_hint_y=None, height='40dp')
        self.anonymous_checkbox.add_widget(Label(text='Denúncia anônima?', size_hint_x=0.8))
        
        try:
            from kivymd.uix.selectioncontrol import MDCheckbox
        except ImportError:
            MDCheckbox = object
        self.is_anonymous = MDCheckbox(size_hint_x=0.2)
        self.anonymous_checkbox.add_widget(self.is_anonymous)
        
        submit_btn = MDRaisedButton(
            text='ENVIAR DENÚNCIA',
            size_hint_y=None,
            height='50dp',
            on_release=self.submit_report,
            pos_hint={'center_x': 0.5}
        )
        
        self.status_label = MDLabel(
            text='',
            halign='center',
            size_hint_y=None,
            height='40dp'
        )
        
        form_layout.add_widget(self.incident_type)
        form_layout.add_widget(self.location_field)
        form_layout.add_widget(self.description_field)
        form_layout.add_widget(self.anonymous_checkbox)
        form_layout.add_widget(submit_btn)
        form_layout.add_widget(self.status_label)
        
        main_layout.add_widget(form_layout)
        self.add_widget(main_layout)
    
    def submit_report(self, *args):
        """Enviar denúncia"""
        if not self.location_field.text.strip() or not self.description_field.text.strip():
            self.status_label.text = "Por favor, preencha todos os campos obrigatórios"
            self.status_label.theme_text_color = "Error"
            return
        
        report_data = {
            'type': self.incident_type.text,
            'location': self.location_field.text.strip(),
            'description': self.description_field.text.strip(),
            'anonymous': self.is_anonymous.active,
            'reporter': None if self.is_anonymous.active else data_manager.get_current_user()
        }
        
        if data_manager.add_report(report_data):
            self.status_label.text = "Denúncia enviada com sucesso!"
            self.status_label.theme_text_color = "Primary"
            
            # Limpar campos
            self.location_field.text = ""
            self.description_field.text = ""
            self.is_anonymous.active = False
            
            Clock.schedule_once(lambda dt: setattr(self.manager, 'current', 'dashboard'), 2)
        else:
            self.status_label.text = "Erro ao enviar denúncia"
            self.status_label.theme_text_color = "Error"


class NoticesScreen(MDScreen):
    """Tela de Avisos"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'notices'
        
        main_layout = MDBoxLayout(orientation='vertical')
        
        # Toolbar
        toolbar = MDTopAppBar(
            title="Avisos da Escola",
            left_action_items=[["arrow-left", lambda x: setattr(self.manager, 'current', 'dashboard')]]
        )
        main_layout.add_widget(toolbar)
        
        # Lista de avisos
        notices_layout = MDBoxLayout(orientation='vertical', padding=10, spacing=10)
        
        notices = data_manager.get_notices()
        
        for notice in notices:
            priority_colors = {"Alta": "red", "Média": "orange", "Baixa": "green"}
            priority_color = priority_colors.get(notice.get('priority', 'Baixa'), 'gray')
            
            card = MDCard(
                MDBoxLayout(
                    MDLabel(
                        text=f"[color={priority_color}]●[/color] {notice['title']}",
                        markup=True,
                        font_style="H6",
                        size_hint_y=None,
                        height='30dp'
                    ),
                    MDLabel(
                        text=f"📅 {notice['date']}",
                        theme_text_color="Hint",
                        size_hint_y=None,
                        height='25dp'
                    ),
                    MDLabel(
                        text=notice['content'],
                        size_hint_y=None,
                        height='40dp'
                    ),
                    orientation='vertical',
                    padding=15,
                    spacing=5
                ),
                size_hint_y=None,
                height='120dp',
                elevation=2
            )
            notices_layout.add_widget(card)
        
        try:
            from kivy.uix.scrollview import ScrollView
        except ImportError:
            ScrollView = object
        scroll = ScrollView()
        scroll.add_widget(notices_layout)
        main_layout.add_widget(scroll)
        
        self.add_widget(main_layout)


class VisitorsScreen(MDScreen):
    """Tela de Visitantes"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'visitors'
        
        main_layout = MDBoxLayout(orientation='vertical')
        
        # Toolbar
        toolbar = MDTopAppBar(
            title="Registrar Visitante",
            left_action_items=[["arrow-left", lambda x: setattr(self.manager, 'current', 'dashboard')]]
        )
        main_layout.add_widget(toolbar)
        
        # Form
        form_layout = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        self.name_field = MDTextField(hint_text='Nome do visitante', size_hint_y=None, height='60dp')
        self.document_field = MDTextField(hint_text='RG/CPF', size_hint_y=None, height='60dp')
        self.purpose_field = MDTextField(hint_text='Motivo da visita', size_hint_y=None, height='60dp')
        self.contact_field = MDTextField(hint_text='Telefone de contato', size_hint_y=None, height='60dp')
        
        register_btn = MDRaisedButton(
            text='REGISTRAR VISITANTE',
            size_hint_y=None,
            height='50dp',
            on_release=self.register_visitor,
            pos_hint={'center_x': 0.5}
        )
        
        self.status_label = MDLabel(
            text='',
            halign='center',
            size_hint_y=None,
            height='40dp'
        )
        
        form_layout.add_widget(self.name_field)
        form_layout.add_widget(self.document_field)
        form_layout.add_widget(self.purpose_field)
        form_layout.add_widget(self.contact_field)
        form_layout.add_widget(register_btn)
        form_layout.add_widget(self.status_label)
        
        main_layout.add_widget(form_layout)
        self.add_widget(main_layout)
    
    def register_visitor(self, *args):
        """Registrar visitante"""
        if not all([self.name_field.text.strip(), self.document_field.text.strip(), self.purpose_field.text.strip()]):
            self.status_label.text = "Preencha todos os campos obrigatórios"
            self.status_label.theme_text_color = "Error"
            return
        
        visitor_id = f"V{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        self.status_label.text = f"Visitante registrado!\nID: {visitor_id}\nEntrada: {datetime.now().strftime('%H:%M')}"
        self.status_label.theme_text_color = "Primary"
        
        # Limpar campos
        self.name_field.text = ""
        self.document_field.text = ""
        self.purpose_field.text = ""
        self.contact_field.text = ""


class AdminScreen(MDScreen):
    """Tela Administrativa"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'admin'
        
        main_layout = MDBoxLayout(orientation='vertical')
        
        # Toolbar
        toolbar = MDTopAppBar(
            title="Área Administrativa",
            left_action_items=[["arrow-left", lambda x: setattr(self.manager, 'current', 'dashboard')]]
        )
        main_layout.add_widget(toolbar)
        
        # Stats cards
        stats_layout = MDBoxLayout(orientation='vertical', padding=10, spacing=10)
        
        reports = data_manager.get_reports()
        total_reports = len(reports)
        
        stats_card = MDCard(
            MDBoxLayout(
                MDLabel(text="📊 Estatísticas", font_style="H6", size_hint_y=None, height='30dp'),
                MDLabel(text=f"Total de denúncias: {total_reports}", size_hint_y=None, height='25dp'),
                MDLabel(text=f"Avisos ativos: {len(data_manager.get_notices())}", size_hint_y=None, height='25dp'),
                MDLabel(text=f"Status: Sistema operacional", size_hint_y=None, height='25dp'),
                orientation='vertical',
                padding=15,
                spacing=5
            ),
            size_hint_y=None,
            height='130dp',
            elevation=2
        )
        stats_layout.add_widget(stats_card)
        
        # Lista de denúncias recentes
        if reports:
            recent_reports_title = MDLabel(
                text="Denúncias Recentes:",
                font_style="H6",
                size_hint_y=None,
                height='40dp'
            )
            stats_layout.add_widget(recent_reports_title)
            
            for report in reports[-3:]:  # Últimas 3 denúncias
                report_card = MDCard(
                    MDBoxLayout(
                        MDLabel(text=f"🆔 {report.get('id', 'N/A')}", font_style="Subtitle1", size_hint_y=None, height='25dp'),
                        MDLabel(text=f"📝 {report.get('type', 'N/A')}", size_hint_y=None, height='25dp'),
                        MDLabel(text=f"📍 {report.get('location', 'N/A')}", size_hint_y=None, height='25dp'),
                        MDLabel(text=f"📅 {report.get('date', 'N/A')[:16]}", theme_text_color="Hint", size_hint_y=None, height='25dp'),
                        orientation='vertical',
                        padding=15,
                        spacing=3
                    ),
                    size_hint_y=None,
                    height='120dp',
                    elevation=2
                )
                stats_layout.add_widget(report_card)
        
        try:
            from kivy.uix.scrollview import ScrollView
        except ImportError:
            ScrollView = object
        scroll = ScrollView()
        scroll.add_widget(stats_layout)
        main_layout.add_widget(scroll)
        
        self.add_widget(main_layout)


class SchoolSecurityApp(MDApp):
    """Aplicativo Principal - Versão Android"""
    
    def build(self):
        self.title = "Sistema de Segurança Escolar"
        self.theme_cls.theme_style = "Light"
        self.theme_cls.primary_palette = "Blue"
        
        # Screen Manager
        sm = ScreenManager()
        
        # Adicionar todas as telas
        sm.add_widget(LoginScreen())
        sm.add_widget(RegisterScreen())
        sm.add_widget(DashboardScreen())
        sm.add_widget(ReportsScreen())
        sm.add_widget(NoticesScreen())
        sm.add_widget(VisitorsScreen())
        sm.add_widget(AdminScreen())
        
        return sm


if __name__ == '__main__':
    # Só executar se Kivy estiver disponível e RUN_KIVY=1
    if KIVY_AVAILABLE and os.getenv('RUN_KIVY') == '1':
        SchoolSecurityApp().run()
    else:
        print("Sistema de Segurança Escolar - Versão Android")
        print("Para executar a interface gráfica:")
        print("  1. Instale as dependências: pip install kivy kivymd")
        print("  2. Execute com: RUN_KIVY=1 python main_android.py")
        print("Ou use: python terminal_app.py para versão terminal")