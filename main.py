"""
Sistema de Segurança Escolar
Aplicativo desenvolvido em Python + Kivy com Firebase
Funcionalidades: Autenticação, Denúncias, Avisos, Vigilância, etc.
"""

from kivy.app import App
from kivy.uix.screenmanager import ScreenManager, Screen
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.button import Button
from kivy.uix.textinput import TextInput
from kivy.uix.spinner import Spinner
from kivy.uix.popup import Popup
from kivy.uix.image import Image
from kivy.clock import Clock
from kivymd.app import MDApp
from kivymd.uix.screen import MDScreen
from kivymd.uix.boxlayout import MDBoxLayout
from kivymd.uix.button import MDRaisedButton, MDIconButton
from kivymd.uix.textfield import MDTextField
from kivymd.uix.card import MDCard
from kivymd.uix.list import MDList, OneLineListItem
from kivymd.uix.selectioncontrol import MDSwitch
from kivymd.uix.label import MDLabel
from kivymd.uix.navigationdrawer import MDNavigationDrawer
from kivymd.uix.toolbar import MDTopAppBar
from kivymd.uix.dialog import MDDialog
from kivymd.uix.button import MDFlatButton
from kivymd.uix.tab import MDTabsBase, MDTabs
from kivymd.uix.floatlayout import MDFloatLayout

import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore, messaging
import pyrebase
from datetime import datetime
import json
import os


class FirebaseManager:
    """Gerenciador do Firebase para autenticação e banco de dados"""
    
    def __init__(self):
        self.config = {
            "apiKey": os.environ.get("FIREBASE_API_KEY"),
            "authDomain": f"{os.environ.get('FIREBASE_PROJECT_ID')}.firebaseapp.com",
            "projectId": os.environ.get("FIREBASE_PROJECT_ID"),
            "storageBucket": f"{os.environ.get('FIREBASE_PROJECT_ID')}.firebasestorage.app",
            "messagingSenderId": "123456789",
            "appId": os.environ.get("FIREBASE_APP_ID"),
            "databaseURL": f"https://{os.environ.get('FIREBASE_PROJECT_ID')}-default-rtdb.firebaseio.com/"
        }
        
        self.firebase = None
        self.auth = None
        self.db = None
        self.current_user = None
        
        self.initialize_firebase()
    
    def initialize_firebase(self):
        """Inicializa o Firebase"""
        try:
            # Inicializar Pyrebase para autenticação
            self.firebase = pyrebase.initialize_app(self.config)
            self.auth = self.firebase.auth()
            
            # Inicializar Firebase Admin para Firestore
            if not firebase_admin._apps:
                cred = credentials.Certificate({
                    "type": "service_account",
                    "project_id": os.environ.get("FIREBASE_PROJECT_ID"),
                    "private_key_id": "dummy",
                    "private_key": "-----BEGIN PRIVATE KEY-----\ndummy\n-----END PRIVATE KEY-----\n",
                    "client_email": f"firebase-adminsdk@{os.environ.get('FIREBASE_PROJECT_ID')}.iam.gserviceaccount.com",
                    "client_id": "dummy",
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token"
                })
                firebase_admin.initialize_app(cred)
            
            self.db = firestore.client()
            print("Firebase inicializado com sucesso!")
            
        except Exception as e:
            print(f"Erro ao inicializar Firebase: {e}")
            # Para desenvolvimento, usar dados locais se Firebase falhar
            self.auth = None
            self.db = None
    
    def sign_up(self, email, password, user_data):
        """Cadastrar novo usuário"""
        try:
            if self.auth:
                user = self.auth.create_user_with_email_and_password(email, password)
                user_id = user['localId']
                
                # Salvar dados adicionais no Firestore
                user_doc = {
                    'uid': user_id,
                    'email': email,
                    'name': user_data.get('name', ''),
                    'user_type': user_data.get('user_type', 'aluno'),
                    'active': True,
                    'created_at': datetime.now(),
                    'last_login': None
                }
                
                if self.db:
                    self.db.collection('users').document(user_id).set(user_doc)
                
                return {'success': True, 'user': user, 'user_data': user_doc}
            else:
                # Modo offline para desenvolvimento
                return {'success': False, 'error': 'Firebase não configurado'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def sign_in(self, email, password):
        """Fazer login"""
        try:
            if self.auth:
                user = self.auth.sign_in_with_email_and_password(email, password)
                user_id = user['localId']
                
                # Buscar dados do usuário no Firestore
                if self.db:
                    user_doc = self.db.collection('users').document(user_id).get()
                    if user_doc.exists:
                        user_data = user_doc.to_dict()
                        
                        # Verificar se usuário está ativo
                        if user_data and not user_data.get('active', True):
                            return {'success': False, 'error': 'Usuário banido do sistema'}
                        
                        # Atualizar último login
                        self.db.collection('users').document(user_id).update({
                            'last_login': datetime.now()
                        })
                        
                        self.current_user = user_data
                        return {'success': True, 'user': user, 'user_data': user_data}
                    else:
                        return {'success': False, 'error': 'Dados do usuário não encontrados'}
                else:
                    self.current_user = {'email': email, 'user_type': 'aluno'}
                    return {'success': True, 'user': user, 'user_data': self.current_user}
            else:
                # Modo offline para desenvolvimento - login fake
                if email == "admin@escola.com" and password == "admin123":
                    self.current_user = {
                        'email': email,
                        'name': 'Administrador',
                        'user_type': 'direcao',
                        'active': True
                    }
                    return {'success': True, 'user': {'localId': 'admin123'}, 'user_data': self.current_user}
                else:
                    return {'success': False, 'error': 'Credenciais inválidas'}
                    
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def sign_out(self):
        """Fazer logout"""
        self.current_user = None
        return True
    
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


class LoginScreen(MDScreen):
    """Tela de Login"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'login'
        
        # Layout principal
        main_layout = MDBoxLayout(orientation='vertical', padding=20, spacing=20)
        
        # Logo/Título
        title = MDLabel(
            text='Sistema de Segurança Escolar',
            halign='center',
            theme_text_color='Primary',
            font_style='H4'
        )
        main_layout.add_widget(title)
        
        # Card de login
        self.login_card = MDCard(
            orientation='vertical',
            padding=30,
            spacing=20,
            size_hint=(0.8, None),
            height='400dp',
            pos_hint={'center_x': 0.5},
            elevation=10
        )
        
        # Campos de login
        self.email_field = MDTextField(
            hint_text='Email',
            helper_text='Digite seu email institucional',
            helper_text_mode='persistent',
            icon_right='email'
        )
        
        self.password_field = MDTextField(
            hint_text='Senha',
            helper_text='Digite sua senha',
            helper_text_mode='persistent',
            password=True,
            icon_right='eye-off'
        )
        
        # Botões
        login_btn = MDRaisedButton(
            text='ENTRAR',
            size_hint_y=None,
            height='50dp',
            on_release=self.login
        )
        
        register_btn = MDFlatButton(
            text='CRIAR CONTA',
            size_hint_y=None,
            height='40dp',
            on_release=self.show_register_form
        )
        
        self.login_card.add_widget(self.email_field)
        self.login_card.add_widget(self.password_field)
        self.login_card.add_widget(login_btn)
        self.login_card.add_widget(register_btn)
        
        main_layout.add_widget(self.login_card)
        self.add_widget(main_layout)
        
        # Status label
        self.status_label = MDLabel(
            text='',
            halign='center',
            theme_text_color='Error'
        )
        main_layout.add_widget(self.status_label)
    
    def login(self, *args):
        """Realizar login"""
        email = self.email_field.text.strip()
        password = self.password_field.text
        
        if not email or not password:
            self.show_message('Por favor, preencha todos os campos')
            return
        
        # Tentar login
        result = firebase_manager.sign_in(email, password)
        
        if result['success']:
            self.show_message('Login realizado com sucesso!', is_error=False)
            # Redirecionar para tela principal
            self.manager.current = 'dashboard'
        else:
            self.show_message(f'Erro no login: {result["error"]}')
    
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
        
        # Layout principal
        main_layout = MDBoxLayout(orientation='vertical', padding=20, spacing=20)
        
        # Título
        title = MDLabel(
            text='Criar Nova Conta',
            halign='center',
            theme_text_color='Primary',
            font_style='H5'
        )
        main_layout.add_widget(title)
        
        # Card de cadastro
        self.register_card = MDCard(
            orientation='vertical',
            padding=30,
            spacing=15,
            size_hint=(0.8, None),
            height='500dp',
            pos_hint={'center_x': 0.5},
            elevation=10
        )
        
        # Campos
        self.name_field = MDTextField(
            hint_text='Nome Completo',
            icon_right='account'
        )
        
        self.email_field = MDTextField(
            hint_text='Email Institucional',
            icon_right='email'
        )
        
        self.password_field = MDTextField(
            hint_text='Senha',
            password=True,
            icon_right='eye-off'
        )
        
        self.confirm_password_field = MDTextField(
            hint_text='Confirmar Senha',
            password=True,
            icon_right='eye-off'
        )
        
        # Spinner para tipo de usuário
        from kivymd.uix.menu import MDDropdownMenu
        from kivymd.uix.button import MDRectangleFlatButton
        
        self.user_type_button = MDRectangleFlatButton(
            text="Tipo de Usuário: Aluno",
            size_hint_y=None,
            height='40dp'
        )
        
        user_type_items = [
            {"text": "Aluno", "viewclass": "OneLineListItem", "on_release": lambda x="aluno": self.set_user_type(x)},
            {"text": "Funcionário", "viewclass": "OneLineListItem", "on_release": lambda x="funcionario": self.set_user_type(x)},
            {"text": "Direção", "viewclass": "OneLineListItem", "on_release": lambda x="direcao": self.set_user_type(x)}
        ]
        
        self.user_type_menu = MDDropdownMenu(
            caller=self.user_type_button,
            items=user_type_items,
            width_mult=4
        )
        
        self.user_type_button.bind(on_release=self.user_type_menu.open)
        self.selected_user_type = 'aluno'
        
        # Botões
        register_btn = MDRaisedButton(
            text='CADASTRAR',
            size_hint_y=None,
            height='50dp',
            on_release=self.register
        )
        
        back_btn = MDFlatButton(
            text='VOLTAR',
            size_hint_y=None,
            height='40dp',
            on_release=self.go_back
        )
        
        self.register_card.add_widget(self.name_field)
        self.register_card.add_widget(self.email_field)
        self.register_card.add_widget(self.password_field)
        self.register_card.add_widget(self.confirm_password_field)
        self.register_card.add_widget(self.user_type_button)
        self.register_card.add_widget(register_btn)
        self.register_card.add_widget(back_btn)
        
        main_layout.add_widget(self.register_card)
        self.add_widget(main_layout)
        
        # Status label
        self.status_label = MDLabel(
            text='',
            halign='center',
            theme_text_color='Error'
        )
        main_layout.add_widget(self.status_label)
    
    def set_user_type(self, user_type):
        """Definir tipo de usuário"""
        self.selected_user_type = user_type
        type_names = {
            'aluno': 'Aluno',
            'funcionario': 'Funcionário',
            'direcao': 'Direção'
        }
        self.user_type_button.text = f"Tipo de Usuário: {type_names[user_type]}"
        self.user_type_menu.dismiss()
    
    def register(self, *args):
        """Realizar cadastro"""
        name = self.name_field.text.strip()
        email = self.email_field.text.strip()
        password = self.password_field.text
        confirm_password = self.confirm_password_field.text
        
        # Validações
        if not all([name, email, password, confirm_password]):
            self.show_message('Por favor, preencha todos os campos')
            return
        
        if password != confirm_password:
            self.show_message('As senhas não coincidem')
            return
        
        if len(password) < 6:
            self.show_message('A senha deve ter pelo menos 6 caracteres')
            return
        
        # Tentar cadastro
        user_data = {
            'name': name,
            'user_type': self.selected_user_type
        }
        
        result = firebase_manager.sign_up(email, password, user_data)
        
        if result['success']:
            self.show_message('Cadastro realizado com sucesso!', is_error=False)
            Clock.schedule_once(lambda dt: setattr(self.manager, 'current', 'login'), 2)
        else:
            self.show_message(f'Erro no cadastro: {result["error"]}')
    
    def go_back(self, *args):
        """Voltar para tela de login"""
        self.manager.current = 'login'
    
    def show_message(self, message, is_error=True):
        """Mostrar mensagem de status"""
        self.status_label.text = message
        if is_error:
            self.status_label.theme_text_color = 'Error'
        else:
            self.status_label.theme_text_color = 'Primary'


class DashboardScreen(MDScreen):
    """Tela Principal (Dashboard)"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'dashboard'
        self.build_dashboard()
    
    def build_dashboard(self):
        """Construir o dashboard"""
        # Layout principal com navigation drawer
        from kivymd.uix.navigationdrawer import MDNavigationLayout, MDNavigationDrawer
        
        self.nav_layout = MDNavigationLayout()
        
        # Conteúdo principal
        self.main_content = MDBoxLayout(orientation='vertical')
        
        # Toolbar
        self.toolbar = MDTopAppBar(
            title="Dashboard - Segurança Escolar",
            left_action_items=[["menu", lambda x: self.nav_drawer.set_state("open")]],
            right_action_items=[["logout", self.logout]]
        )
        self.main_content.add_widget(self.toolbar)
        
        # Área de conteúdo
        self.content_area = MDBoxLayout(
            orientation='vertical',
            padding=10,
            spacing=10
        )
        
        # Cards de funcionalidades principais
        self.create_main_cards()
        
        self.main_content.add_widget(self.content_area)
        
        # Navigation Drawer
        self.nav_drawer = MDNavigationDrawer()
        self.create_navigation_menu()
        
        self.nav_layout.add_widget(self.main_content)
        self.nav_layout.add_widget(self.nav_drawer)
        
        self.add_widget(self.nav_layout)
    
    def create_main_cards(self):
        """Criar cards principais do dashboard"""
        user = firebase_manager.get_current_user()
        if not user:
            return
        
        # Botão de Emergência (sempre visível)
        emergency_card = MDCard(
            MDBoxLayout(
                MDLabel(
                    text="🚨 EMERGÊNCIA",
                    halign="center",
                    font_style="H6",
                    theme_text_color="Error"
                ),
                MDRaisedButton(
                    text="ACIONAR EMERGÊNCIA",
                    theme_icon_color="Custom",
                    md_bg_color="red",
                    on_release=self.trigger_emergency
                ),
                orientation='vertical',
                padding=15,
                spacing=10
            ),
            size_hint=(1, None),
            height='120dp',
            elevation=5
        )
        self.content_area.add_widget(emergency_card)
        
        # Cards baseados em permissões
        if firebase_manager.has_permission('denunciar'):
            report_card = MDCard(
                MDBoxLayout(
                    MDLabel(text="📝 Denúncias", font_style="H6"),
                    MDRaisedButton(
                        text="Nova Denúncia",
                        on_release=self.open_reports
                    ),
                    orientation='vertical',
                    padding=15,
                    spacing=10
                ),
                size_hint=(1, None),
                height='100dp'
            )
            self.content_area.add_widget(report_card)
        
        if firebase_manager.has_permission('ver_avisos'):
            notices_card = MDCard(
                MDBoxLayout(
                    MDLabel(text="📢 Avisos", font_style="H6"),
                    MDRaisedButton(
                        text="Ver Avisos",
                        on_release=self.open_notices
                    ),
                    orientation='vertical',
                    padding=15,
                    spacing=10
                ),
                size_hint=(1, None),
                height='100dp'
            )
            self.content_area.add_widget(notices_card)
        
        if firebase_manager.has_permission('registrar_visitantes'):
            visitors_card = MDCard(
                MDBoxLayout(
                    MDLabel(text="👥 Visitantes", font_style="H6"),
                    MDRaisedButton(
                        text="Registrar Visitante",
                        on_release=self.open_visitors
                    ),
                    orientation='vertical',
                    padding=15,
                    spacing=10
                ),
                size_hint=(1, None),
                height='100dp'
            )
            self.content_area.add_widget(visitors_card)
    
    def create_navigation_menu(self):
        """Criar menu de navegação lateral"""
        menu_layout = MDBoxLayout(orientation='vertical', padding=10, spacing=5)
        
        # Header do menu
        user = firebase_manager.get_current_user()
        if user:
            user_info = MDLabel(
                text=f"Olá, {user.get('name', user.get('email', 'Usuário'))}",
                font_style="Subtitle1",
                size_hint_y=None,
                height='40dp'
            )
            menu_layout.add_widget(user_info)
        
        # Itens do menu baseados em permissões
        menu_items = []
        
        if firebase_manager.has_permission('ver_avisos'):
            menu_items.append(("📢 Avisos", self.open_notices))
            
        if firebase_manager.has_permission('denunciar'):
            menu_items.append(("📝 Denúncias", self.open_reports))
            
        if firebase_manager.has_permission('registrar_visitantes'):
            menu_items.append(("👥 Visitantes", self.open_visitors))
            
        if firebase_manager.has_permission('adicionar_ocorrencias'):
            menu_items.append(("📋 Ocorrências", self.open_incidents))
            
        if firebase_manager.has_permission('ver_campanhas'):
            menu_items.append(("📚 Campanhas", self.open_campaigns))
        
        menu_items.append(("🛡️ Segurança", self.open_security))
        menu_items.append(("📊 Relatórios", self.open_reports_admin))
        menu_items.append(("⚙️ Configurações", self.open_settings))
        menu_items.append(("🚪 Sair", self.logout))
        
        for item_text, callback in menu_items:
            btn = MDFlatButton(
                text=item_text,
                size_hint_y=None,
                height='40dp',
                on_release=callback
            )
            menu_layout.add_widget(btn)
        
        self.nav_drawer.add_widget(menu_layout)
    
    def trigger_emergency(self, *args):
        """Acionar emergência"""
        dialog = MDDialog(
            title="Confirmação de Emergência",
            text="Você tem certeza que deseja acionar o alerta de emergência?",
            buttons=[
                MDFlatButton(
                    text="CANCELAR",
                    theme_text_color="Custom",
                    text_color=[1, 0, 0, 1],
                    on_release=lambda x: dialog.dismiss()
                ),
                MDFlatButton(
                    text="CONFIRMAR",
                    theme_text_color="Custom",
                    text_color=[0, 1, 0, 1],
                    on_release=lambda x: self.send_emergency_alert(dialog)
                ),
            ],
        )
        dialog.open()
    
    def send_emergency_alert(self, dialog):
        """Enviar alerta de emergência"""
        try:
            # Aqui seria enviado o push notification
            user = firebase_manager.get_current_user()
            alert_data = {
                'type': 'emergency',
                'timestamp': datetime.now().isoformat(),
                'user': user.get('name', 'Anônimo') if user else 'Anônimo',
                'status': 'active'
            }
            
            # Salvar no Firestore (se disponível)
            if firebase_manager.db:
                firebase_manager.db.collection('emergency_alerts').add(alert_data)
            
            dialog.dismiss()
            
            success_dialog = MDDialog(
                title="Emergência Acionada!",
                text="O alerta foi enviado para a equipe de segurança.",
                buttons=[MDFlatButton(text="OK", on_release=lambda x: success_dialog.dismiss())]
            )
            success_dialog.open()
            
        except Exception as e:
            dialog.dismiss()
            error_dialog = MDDialog(
                title="Erro",
                text=f"Não foi possível enviar o alerta: {str(e)}",
                buttons=[MDFlatButton(text="OK", on_release=lambda x: error_dialog.dismiss())]
            )
            error_dialog.open()
    
    def open_reports(self, *args):
        """Abrir tela de denúncias"""
        self.manager.current = 'reports'
        self.nav_drawer.set_state("close")
    
    def open_notices(self, *args):
        """Abrir tela de avisos"""
        self.manager.current = 'notices'
        self.nav_drawer.set_state("close")
    
    def open_visitors(self, *args):
        """Abrir tela de visitantes"""
        self.manager.current = 'visitors'
        self.nav_drawer.set_state("close")
    
    def open_incidents(self, *args):
        """Abrir tela de ocorrências"""
        self.manager.current = 'incidents'
        self.nav_drawer.set_state("close")
    
    def open_campaigns(self, *args):
        """Abrir tela de campanhas"""
        self.manager.current = 'campaigns'
        self.nav_drawer.set_state("close")
    
    def open_security(self, *args):
        """Abrir tela de segurança"""
        self.manager.current = 'security'
        self.nav_drawer.set_state("close")
    
    def open_reports_admin(self, *args):
        """Abrir tela de relatórios administrativos"""
        if firebase_manager.has_permission('gerar_relatorios'):
            self.manager.current = 'admin_reports'
            self.nav_drawer.set_state("close")
    
    def open_settings(self, *args):
        """Abrir configurações"""
        self.manager.current = 'settings'
        self.nav_drawer.set_state("close")
    
    def logout(self, *args):
        """Fazer logout"""
        firebase_manager.sign_out()
        self.manager.current = 'login'
        self.nav_drawer.set_state("close")


class SchoolSecurityApp(MDApp):
    """Aplicativo Principal"""
    
    def build(self):
        self.title = "Sistema de Segurança Escolar"
        self.theme_cls.theme_style = "Light"
        self.theme_cls.primary_palette = "Blue"
        
        # Screen Manager
        sm = ScreenManager()
        
        # Adicionar telas
        sm.add_widget(LoginScreen())
        sm.add_widget(RegisterScreen())
        sm.add_widget(DashboardScreen())
        
        return sm


if __name__ == '__main__':
    SchoolSecurityApp().run()