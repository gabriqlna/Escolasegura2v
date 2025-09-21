"""
Sistema de Segurança Escolar
Aplicativo desenvolvido em Python + Kivy com Firebase
Funcionalidades: Autenticação, Denúncias, Avisos, Vigilância, etc.
"""

import os
# Configurações para ambiente Replit com VNC
if not os.environ.get('DISPLAY'):
    os.environ['DISPLAY'] = ':0'

# Configurar Kivy para usar renderização por software
os.environ['KIVY_GL_BACKEND'] = 'mock'
os.environ['KIVY_WINDOW'] = 'sdl2'
os.environ['MESA_GL_VERSION_OVERRIDE'] = '3.3'
os.environ['MESA_GLSL_VERSION_OVERRIDE'] = '330'

# Adicionar configurações para evitar problemas de OpenGL - imports opcionais
try:
    import kivy
    kivy.require('2.1.0')
    from kivy.config import Config
    Config.set('graphics', 'multisamples', '0')
    Config.set('graphics', 'vsync', '0')
    Config.set('graphics', 'depth', '0')
    Config.set('graphics', 'stencil', '0')
    Config.set('graphics', 'double', '0')
    Config.set('input', 'mouse', 'mouse,multitouch_on_demand')

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
    
    KIVY_AVAILABLE = True
except ImportError:
    # Fallbacks para quando Kivy não está disponível
    kivy = None
    Config = None
    App = object
    ScreenManager = Screen = BoxLayout = Label = Button = object
    TextInput = Spinner = Popup = Image = Clock = object
    MDApp = MDScreen = MDBoxLayout = object
    MDRaisedButton = MDIconButton = MDTextField = object
    MDCard = MDList = OneLineListItem = MDSwitch = object
    MDLabel = MDNavigationDrawer = MDTopAppBar = object
    MDDialog = MDFlatButton = MDTabsBase = MDTabs = object
    MDFloatLayout = object
    
    KIVY_AVAILABLE = False

try:
    import firebase_admin
    from firebase_admin import credentials, auth as firebase_auth, firestore, messaging
    import pyrebase
    FIREBASE_AVAILABLE = True
except ImportError:
    firebase_admin = None
    credentials = firebase_auth = firestore = messaging = object
    pyrebase = None
    FIREBASE_AVAILABLE = False

from datetime import datetime
import json


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
            # Verificar se Firebase está disponível
            if not FIREBASE_AVAILABLE:
                print("🔧 Firebase não disponível - usando modo demonstração")
                self.auth = None
                self.db = None
                return
            
            # Verificar se temos configurações básicas
            if not self.config.get("apiKey") or self.config["apiKey"] == "None":
                print("🔧 Credenciais Firebase não configuradas - usando modo demonstração")
                self.auth = None
                self.db = None
                return
                
            # Inicializar Pyrebase para autenticação
            self.firebase = pyrebase.initialize_app(self.config)
            self.auth = self.firebase.auth()
            
            # Inicializar Firebase Admin para Firestore
            if not firebase_admin._apps:
                # Tentar usar arquivo de credenciais real primeiro
                cred_file = "firebase-service-account.json"
                if os.path.exists(cred_file):
                    cred = credentials.Certificate(cred_file)
                    firebase_admin.initialize_app(cred)
                    print("Firebase Admin inicializado com credenciais do arquivo")
                else:
                    # Usar credenciais das variáveis de ambiente se disponível
                    service_account_key = os.environ.get("FIREBASE_SERVICE_ACCOUNT_KEY")
                    if service_account_key:
                        import json
                        cred_dict = json.loads(service_account_key)
                        cred = credentials.Certificate(cred_dict)
                        firebase_admin.initialize_app(cred)
                        print("Firebase Admin inicializado com credenciais das variáveis de ambiente")
                    else:
                        # Fallback para modo básico sem admin
                        print("Firebase Admin não inicializado - usando apenas Auth básico")
                        self.db = None
                        return
            
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
        try:
            from kivymd.uix.menu import MDDropdownMenu
            from kivymd.uix.button import MDRectangleFlatButton
        except ImportError:
            MDDropdownMenu = MDRectangleFlatButton = object
        
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
        try:
            from kivymd.uix.navigationdrawer import MDNavigationLayout, MDNavigationDrawer
        except ImportError:
            MDNavigationLayout = MDNavigationDrawer = object
        
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
            
        menu_items.append(("Simulados", self.open_drills))
        menu_items.append(("Segurança", self.open_security))
        menu_items.append(("Relatórios", self.open_reports_admin))
        menu_items.append(("Configurações", self.open_settings))
        menu_items.append(("Sair", self.logout))
        
        # Mapeamento de ícones para cada item do menu
        menu_icons = {
            "Avisos": "bullhorn",
            "Denúncias": "file-document", 
            "Visitantes": "account-group",
            "Ocorrências": "clipboard-list",
            "Campanhas": "school",
            "Simulados": "calendar-clock",
            "Segurança": "shield-check",
            "Relatórios": "chart-bar",
            "Configurações": "cog",
            "Sair": "logout"
        }
        
        for item_text, callback in menu_items:
            # Layout horizontal para ícone + texto
            item_layout = MDBoxLayout(
                orientation='horizontal',
                size_hint_y=None,
                height='45dp',
                spacing=10,
                padding=[10, 5, 10, 5]
            )
            
            # Ícone
            icon = menu_icons.get(item_text, "circle")
            icon_btn = MDIconButton(
                icon=icon,
                theme_icon_color="Primary",
                size_hint_x=None,
                width='30dp'
            )
            
            # Botão de texto
            text_btn = MDFlatButton(
                text=item_text,
                size_hint_x=None,
                width='150dp',
                on_release=callback
            )
            
            item_layout.add_widget(icon_btn)
            item_layout.add_widget(text_btn)
            menu_layout.add_widget(item_layout)
        
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
    
    def open_drills(self, *args):
        """Abrir tela de simulados"""
        self.manager.current = 'drills'
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


class ReportsScreen(MDScreen):
    """Tela de Denúncias"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'reports'
        self.build_screen()
    
    def build_screen(self):
        layout = MDBoxLayout(orientation='vertical')
        
        # Toolbar
        toolbar = MDTopAppBar(
            title="Denúncias",
            left_action_items=[["arrow-left", lambda x: self.go_back()]]
        )
        layout.add_widget(toolbar)
        
        # Conteúdo
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        # Card de nova denúncia
        new_report_card = MDCard(
            orientation='vertical',
            padding=20,
            spacing=10,
            size_hint=(1, None),
            height='300dp'
        )
        
        title_label = MDLabel(text="Nova Denúncia", font_style="H6")
        
        self.report_type = MDTextField(
            hint_text="Tipo da denúncia (bullying, violência, etc.)",
            multiline=False
        )
        
        self.report_description = MDTextField(
            hint_text="Descrição detalhada da situação",
            multiline=True,
            max_text_length=500
        )
        
        # Switch para denúncia anônima
        anonymous_layout = MDBoxLayout(size_hint_y=None, height='40dp')
        anonymous_layout.add_widget(MDLabel(text="Denúncia Anônima", size_hint_x=0.7))
        self.anonymous_switch = MDSwitch(size_hint_x=0.3)
        anonymous_layout.add_widget(self.anonymous_switch)
        
        submit_btn = MDRaisedButton(
            text="ENVIAR DENÚNCIA",
            on_release=self.submit_report
        )
        
        new_report_card.add_widget(title_label)
        new_report_card.add_widget(self.report_type)
        new_report_card.add_widget(self.report_description)
        new_report_card.add_widget(anonymous_layout)
        new_report_card.add_widget(submit_btn)
        
        content.add_widget(new_report_card)
        
        # Lista de denúncias (se for direção)
        if firebase_manager.has_permission('ver_denuncias'):
            reports_list_card = MDCard(
                orientation='vertical',
                padding=15,
                spacing=10,
                size_hint=(1, None),
                height='200dp'
            )
            
            reports_title = MDLabel(text="Denúncias Recebidas", font_style="H6")
            reports_list_card.add_widget(reports_title)
            
            # Lista seria carregada do Firebase
            sample_reports = [
                "Bullying no pátio - 15/09/2025",
                "Vandalismo na biblioteca - 14/09/2025", 
                "Comportamento inadequado - 13/09/2025"
            ]
            
            for report in sample_reports:
                item = OneLineListItem(text=report)
                reports_list_card.add_widget(item)
            
            content.add_widget(reports_list_card)
        
        layout.add_widget(content)
        self.add_widget(layout)
    
    def submit_report(self, *args):
        report_type = self.report_type.text.strip()
        description = self.report_description.text.strip()
        is_anonymous = self.anonymous_switch.active
        
        if not report_type or not description:
            self.show_dialog("Erro", "Preencha todos os campos obrigatórios")
            return
        
        user = firebase_manager.get_current_user()
        
        report_data = {
            'type': report_type,
            'description': description,
            'anonymous': is_anonymous,
            'reporter': None if is_anonymous else (user.get('name', 'Anônimo') if user else 'Anônimo'),
            'reporter_email': None if is_anonymous else (user.get('email') if user else None),
            'timestamp': datetime.now().isoformat(),
            'status': 'pending'
        }
        
        try:
            # Salvar no Firestore
            if firebase_manager.db:
                firebase_manager.db.collection('reports').add(report_data)
            
            # Limpar campos
            self.report_type.text = ""
            self.report_description.text = ""
            self.anonymous_switch.active = False
            
            self.show_dialog("Sucesso", "Denúncia enviada com sucesso!")
            
        except Exception as e:
            self.show_dialog("Erro", f"Não foi possível enviar a denúncia: {str(e)}")
    
    def show_dialog(self, title, text):
        dialog = MDDialog(
            title=title,
            text=text,
            buttons=[MDFlatButton(text="OK", on_release=lambda x: dialog.dismiss())]
        )
        dialog.open()
    
    def go_back(self):
        self.manager.current = 'dashboard'


class NoticesScreen(MDScreen):
    """Tela de Avisos"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'notices'
        self.build_screen()
    
    def build_screen(self):
        layout = MDBoxLayout(orientation='vertical')
        
        # Toolbar
        toolbar = MDTopAppBar(
            title="Avisos",
            left_action_items=[["arrow-left", lambda x: self.go_back()]]
        )
        layout.add_widget(toolbar)
        
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        # Se for direção, mostrar formulário para criar aviso
        if firebase_manager.has_permission('criar_avisos'):
            create_notice_card = MDCard(
                orientation='vertical',
                padding=20,
                spacing=10,
                size_hint=(1, None),
                height='250dp'
            )
            
            create_title = MDLabel(text="Criar Novo Aviso", font_style="H6")
            
            self.notice_title = MDTextField(hint_text="Título do aviso")
            self.notice_content = MDTextField(
                hint_text="Conteúdo do aviso",
                multiline=True
            )
            
            # Switch para aviso urgente
            urgent_layout = MDBoxLayout(size_hint_y=None, height='40dp')
            urgent_layout.add_widget(MDLabel(text="Aviso Urgente", size_hint_x=0.7))
            self.urgent_switch = MDSwitch(size_hint_x=0.3)
            urgent_layout.add_widget(self.urgent_switch)
            
            create_btn = MDRaisedButton(
                text="PUBLICAR AVISO",
                on_release=self.create_notice
            )
            
            create_notice_card.add_widget(create_title)
            create_notice_card.add_widget(self.notice_title)
            create_notice_card.add_widget(self.notice_content)
            create_notice_card.add_widget(urgent_layout)
            create_notice_card.add_widget(create_btn)
            
            content.add_widget(create_notice_card)
        
        # Lista de avisos
        notices_card = MDCard(
            orientation='vertical',
            padding=15,
            spacing=10,
            size_hint=(1, None),
            height='300dp'
        )
        
        notices_title = MDLabel(text="Avisos Recentes", font_style="H6")
        notices_card.add_widget(notices_title)
        
        # Avisos de exemplo
        sample_notices = [
            {"text": "URGENTE: Simulado de evacuação amanhã às 10h", "icon": "alert-circle", "color": "red"},
            {"text": "Reunião de pais - 25/09/2025", "icon": "information-outline", "color": "blue"},
            {"text": "Obras no refeitório - funcionamento reduzido", "icon": "tools", "color": "orange"},
            {"text": "Nova campanha contra o bullying", "icon": "school", "color": "green"}
        ]
        
        for notice in sample_notices:
            notice_layout = MDBoxLayout(
                size_hint_y=None,
                height='60dp',
                spacing=10,
                padding=[10, 5, 10, 5]
            )
            
            # Ícone do aviso
            notice_icon = MDIconButton(
                icon=notice["icon"],
                theme_icon_color="Custom",
                icon_color=notice["color"],
                size_hint_x=None,
                width='40dp'
            )
            
            # Texto do aviso
            notice_label = MDLabel(text=notice["text"])
            
            notice_layout.add_widget(notice_icon)
            notice_layout.add_widget(notice_label)
            notices_card.add_widget(notice_layout)
        
        content.add_widget(notices_card)
        layout.add_widget(content)
        self.add_widget(layout)
    
    def create_notice(self, *args):
        title = self.notice_title.text.strip()
        content = self.notice_content.text.strip()
        is_urgent = self.urgent_switch.active
        
        if not title or not content:
            self.show_dialog("Erro", "Preencha todos os campos")
            return
        
        user = firebase_manager.get_current_user()
        
        notice_data = {
            'title': title,
            'content': content,
            'urgent': is_urgent,
            'author': user.get('name', 'Administração') if user else 'Administração',
            'timestamp': datetime.now().isoformat(),
            'active': True
        }
        
        try:
            if firebase_manager.db:
                firebase_manager.db.collection('notices').add(notice_data)
            
            # Se for urgente, enviar push notification
            if is_urgent:
                # Aqui seria implementado o envio de push notification
                pass
            
            self.notice_title.text = ""
            self.notice_content.text = ""
            self.urgent_switch.active = False
            
            self.show_dialog("Sucesso", "Aviso publicado com sucesso!")
            
        except Exception as e:
            self.show_dialog("Erro", f"Erro ao publicar aviso: {str(e)}")
    
    def show_dialog(self, title, text):
        dialog = MDDialog(
            title=title,
            text=text,
            buttons=[MDFlatButton(text="OK", on_release=lambda x: dialog.dismiss())]
        )
        dialog.open()
    
    def go_back(self):
        self.manager.current = 'dashboard'


class VisitorsScreen(MDScreen):
    """Tela de Controle de Visitantes"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'visitors'
        self.build_screen()
    
    def build_screen(self):
        layout = MDBoxLayout(orientation='vertical')
        
        toolbar = MDTopAppBar(
            title="Controle de Visitantes",
            left_action_items=[["arrow-left", lambda x: self.go_back()]]
        )
        layout.add_widget(toolbar)
        
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        # Formulário de registro
        register_card = MDCard(
            orientation='vertical',
            padding=20,
            spacing=10,
            size_hint=(1, None),
            height='350dp'
        )
        
        form_title = MDLabel(text="Registrar Visitante", font_style="H6")
        
        self.visitor_name = MDTextField(hint_text="Nome completo")
        self.visitor_doc = MDTextField(hint_text="Documento (CPF/RG)")
        self.visitor_purpose = MDTextField(hint_text="Motivo da visita")
        self.visitor_destination = MDTextField(hint_text="Local de destino na escola")
        
        register_btn = MDRaisedButton(
            text="REGISTRAR ENTRADA",
            on_release=self.register_visitor
        )
        
        register_card.add_widget(form_title)
        register_card.add_widget(self.visitor_name)
        register_card.add_widget(self.visitor_doc)
        register_card.add_widget(self.visitor_purpose)
        register_card.add_widget(self.visitor_destination)
        register_card.add_widget(register_btn)
        
        content.add_widget(register_card)
        
        # Lista de visitantes ativos
        active_visitors_card = MDCard(
            orientation='vertical',
            padding=15,
            spacing=10,
            size_hint=(1, None),
            height='200dp'
        )
        
        active_title = MDLabel(text="Visitantes na Escola", font_style="H6")
        active_visitors_card.add_widget(active_title)
        
        # Lista seria carregada do Firebase
        sample_visitors = [
            "João Silva - CPF: 123.456.789-00 - 14:30",
            "Maria Santos - RG: 12.345.678-9 - 15:15"
        ]
        
        for visitor in sample_visitors:
            visitor_layout = MDBoxLayout(size_hint_y=None, height='40dp')
            visitor_layout.add_widget(MDLabel(text=visitor, size_hint_x=0.8))
            
            checkout_btn = MDIconButton(
                icon="logout",
                theme_icon_color="Custom",
                icon_color="red",
                on_release=lambda x, v=visitor: self.checkout_visitor(v)
            )
            visitor_layout.add_widget(checkout_btn)
            active_visitors_card.add_widget(visitor_layout)
        
        content.add_widget(active_visitors_card)
        layout.add_widget(content)
        self.add_widget(layout)
    
    def register_visitor(self, *args):
        name = self.visitor_name.text.strip()
        document = self.visitor_doc.text.strip()
        purpose = self.visitor_purpose.text.strip()
        destination = self.visitor_destination.text.strip()
        
        if not all([name, document, purpose, destination]):
            self.show_dialog("Erro", "Preencha todos os campos")
            return
        
        user = firebase_manager.get_current_user()
        
        visitor_data = {
            'name': name,
            'document': document,
            'purpose': purpose,
            'destination': destination,
            'check_in': datetime.now().isoformat(),
            'check_out': None,
            'registered_by': user.get('name', 'Funcionário') if user else 'Funcionário',
            'status': 'active'
        }
        
        try:
            if firebase_manager.db:
                firebase_manager.db.collection('visitors').add(visitor_data)
            
            # Limpar campos
            self.visitor_name.text = ""
            self.visitor_doc.text = ""
            self.visitor_purpose.text = ""
            self.visitor_destination.text = ""
            
            self.show_dialog("Sucesso", "Visitante registrado com sucesso!")
            
        except Exception as e:
            self.show_dialog("Erro", f"Erro ao registrar visitante: {str(e)}")
    
    def checkout_visitor(self, visitor_info):
        # Implementar checkout do visitante
        self.show_dialog("Saída", f"Registrando saída do visitante")
    
    def show_dialog(self, title, text):
        dialog = MDDialog(
            title=title,
            text=text,
            buttons=[MDFlatButton(text="OK", on_release=lambda x: dialog.dismiss())]
        )
        dialog.open()
    
    def go_back(self):
        self.manager.current = 'dashboard'


class IncidentsScreen(MDScreen):
    """Tela de Diário de Ocorrências"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'incidents'
        self.build_screen()
    
    def build_screen(self):
        layout = MDBoxLayout(orientation='vertical')
        
        toolbar = MDTopAppBar(
            title="Diário de Ocorrências",
            left_action_items=[["arrow-left", lambda x: self.go_back()]]
        )
        layout.add_widget(toolbar)
        
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        # Formulário de nova ocorrência
        new_incident_card = MDCard(
            orientation='vertical',
            padding=20,
            spacing=10,
            size_hint=(1, None),
            height='300dp'
        )
        
        form_title = MDLabel(text="Nova Ocorrência", font_style="H6")
        
        self.incident_type = MDTextField(hint_text="Tipo de ocorrência")
        self.incident_location = MDTextField(hint_text="Local da ocorrência")
        self.incident_description = MDTextField(
            hint_text="Descrição detalhada",
            multiline=True
        )
        
        add_btn = MDRaisedButton(
            text="REGISTRAR OCORRÊNCIA",
            on_release=self.add_incident
        )
        
        new_incident_card.add_widget(form_title)
        new_incident_card.add_widget(self.incident_type)
        new_incident_card.add_widget(self.incident_location)
        new_incident_card.add_widget(self.incident_description)
        new_incident_card.add_widget(add_btn)
        
        content.add_widget(new_incident_card)
        
        # Lista de ocorrências recentes
        incidents_card = MDCard(
            orientation='vertical',
            padding=15,
            spacing=10,
            size_hint=(1, None),
            height='200dp'
        )
        
        incidents_title = MDLabel(text="Ocorrências Recentes", font_style="H6")
        incidents_card.add_widget(incidents_title)
        
        sample_incidents = [
            "Equipamento danificado - Lab. Informática - 15/09",
            "Conflito entre alunos - Pátio - 14/09",
            "Problema elétrico - Sala 201 - 13/09"
        ]
        
        for incident in sample_incidents:
            item = OneLineListItem(text=incident)
            incidents_card.add_widget(item)
        
        content.add_widget(incidents_card)
        layout.add_widget(content)
        self.add_widget(layout)
    
    def add_incident(self, *args):
        incident_type = self.incident_type.text.strip()
        location = self.incident_location.text.strip()
        description = self.incident_description.text.strip()
        
        if not all([incident_type, location, description]):
            self.show_dialog("Erro", "Preencha todos os campos")
            return
        
        user = firebase_manager.get_current_user()
        
        incident_data = {
            'type': incident_type,
            'location': location,
            'description': description,
            'timestamp': datetime.now().isoformat(),
            'reported_by': user.get('name', 'Funcionário') if user else 'Funcionário',
            'status': 'open'
        }
        
        try:
            if firebase_manager.db:
                firebase_manager.db.collection('incidents').add(incident_data)
            
            # Limpar campos
            self.incident_type.text = ""
            self.incident_location.text = ""
            self.incident_description.text = ""
            
            self.show_dialog("Sucesso", "Ocorrência registrada com sucesso!")
            
        except Exception as e:
            self.show_dialog("Erro", f"Erro ao registrar ocorrência: {str(e)}")
    
    def show_dialog(self, title, text):
        dialog = MDDialog(
            title=title,
            text=text,
            buttons=[MDFlatButton(text="OK", on_release=lambda x: dialog.dismiss())]
        )
        dialog.open()
    
    def go_back(self):
        self.manager.current = 'dashboard'


class CampaignsScreen(MDScreen):
    """Tela de Campanhas Educativas"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'campaigns'
        self.build_screen()
    
    def build_screen(self):
        layout = MDBoxLayout(orientation='vertical')
        
        toolbar = MDTopAppBar(
            title="Campanhas Educativas",
            left_action_items=[["arrow-left", lambda x: self.go_back()]]
        )
        layout.add_widget(toolbar)
        
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        # Se for direção, mostrar formulário para criar campanha
        if firebase_manager.has_permission('cadastrar_campanhas'):
            create_campaign_card = MDCard(
                orientation='vertical',
                padding=20,
                spacing=10,
                size_hint=(1, None),
                height='300dp'
            )
            
            form_title = MDLabel(text="Nova Campanha", font_style="H6")
            
            self.campaign_title = MDTextField(hint_text="Título da campanha")
            self.campaign_description = MDTextField(
                hint_text="Descrição e objetivos",
                multiline=True
            )
            self.campaign_duration = MDTextField(hint_text="Duração (ex: 1 semana, 1 mês)")
            
            create_btn = MDRaisedButton(
                text="CRIAR CAMPANHA",
                on_release=self.create_campaign
            )
            
            create_campaign_card.add_widget(form_title)
            create_campaign_card.add_widget(self.campaign_title)
            create_campaign_card.add_widget(self.campaign_description)
            create_campaign_card.add_widget(self.campaign_duration)
            create_campaign_card.add_widget(create_btn)
            
            content.add_widget(create_campaign_card)
        
        # Lista de campanhas ativas
        campaigns_card = MDCard(
            orientation='vertical',
            padding=15,
            spacing=10,
            size_hint=(1, None),
            height='300dp'
        )
        
        campaigns_title = MDLabel(text="Campanhas Ativas", font_style="H6")
        campaigns_card.add_widget(campaigns_title)
        
        sample_campaigns = [
            {"text": "Campanha Anti-Bullying - Setembro 2025", "icon": "shield-account"},
            {"text": "Diga Não às Drogas - Mês todo", "icon": "close-circle-outline"},
            {"text": "Respeito e Inclusão - Permanente", "icon": "account-heart"},
            {"text": "Sustentabilidade na Escola - Outubro", "icon": "leaf"}
        ]
        
        for campaign in sample_campaigns:
            campaign_layout = MDBoxLayout(
                size_hint_y=None,
                height='60dp',
                spacing=10,
                padding=[10, 5, 10, 5]
            )
            
            # Ícone da campanha
            campaign_icon = MDIconButton(
                icon=campaign["icon"],
                theme_icon_color="Primary",
                size_hint_x=None,
                width='40dp'
            )
            
            # Texto da campanha
            campaign_label = MDLabel(text=campaign["text"])
            
            campaign_layout.add_widget(campaign_icon)
            campaign_layout.add_widget(campaign_label)
            campaigns_card.add_widget(campaign_layout)
        
        content.add_widget(campaigns_card)
        layout.add_widget(content)
        self.add_widget(layout)
    
    def create_campaign(self, *args):
        title = self.campaign_title.text.strip()
        description = self.campaign_description.text.strip()
        duration = self.campaign_duration.text.strip()
        
        if not all([title, description, duration]):
            self.show_dialog("Erro", "Preencha todos os campos")
            return
        
        user = firebase_manager.get_current_user()
        
        campaign_data = {
            'title': title,
            'description': description,
            'duration': duration,
            'created_by': user.get('name', 'Direção') if user else 'Direção',
            'created_at': datetime.now().isoformat(),
            'status': 'active'
        }
        
        try:
            if firebase_manager.db:
                firebase_manager.db.collection('campaigns').add(campaign_data)
            
            self.campaign_title.text = ""
            self.campaign_description.text = ""
            self.campaign_duration.text = ""
            
            self.show_dialog("Sucesso", "Campanha criada com sucesso!")
            
        except Exception as e:
            self.show_dialog("Erro", f"Erro ao criar campanha: {str(e)}")
    
    def show_dialog(self, title, text):
        dialog = MDDialog(
            title=title,
            text=text,
            buttons=[MDFlatButton(text="OK", on_release=lambda x: dialog.dismiss())]
        )
        dialog.open()
    
    def go_back(self):
        self.manager.current = 'dashboard'


class SecurityScreen(MDScreen):
    """Tela de Segurança (Painel, Checklist, Evacuação)"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'security'
        self.build_screen()
    
    def build_screen(self):
        try:
            from kivymd.uix.tab import MDTabs, MDTabsBase
            from kivymd.uix.floatlayout import MDFloatLayout
        except ImportError:
            MDTabs = MDTabsBase = MDFloatLayout = object
        
        layout = MDBoxLayout(orientation='vertical')
        
        toolbar = MDTopAppBar(
            title="Segurança",
            left_action_items=[["arrow-left", lambda x: self.go_back()]]
        )
        layout.add_widget(toolbar)
        
        # Usar cards simples ao invés de tabs para evitar problemas de API
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        # Botões para navegar entre seções
        nav_layout = MDBoxLayout(size_hint_y=None, height='50dp', spacing=10)
        
        surveillance_btn = MDRaisedButton(
            text="Vigilância",
            icon="cctv",
            size_hint_x=0.33,
            on_release=lambda x: self.show_surveillance()
        )
        checklist_btn = MDRaisedButton(
            text="Checklist", 
            icon="checkbox-marked-circle",
            size_hint_x=0.33,
            on_release=lambda x: self.show_checklist()
        )
        evacuation_btn = MDRaisedButton(
            text="Evacuação",
            icon="exit-run",
            size_hint_x=0.33,
            on_release=lambda x: self.show_evacuation()
        )
        
        nav_layout.add_widget(surveillance_btn)
        nav_layout.add_widget(checklist_btn)
        nav_layout.add_widget(evacuation_btn)
        
        content.add_widget(nav_layout)
        
        # Área de conteúdo principal
        self.main_content_area = MDBoxLayout(orientation='vertical')
        
        # Mostrar vigilância por padrão
        self.main_content_area.add_widget(self.create_surveillance_content())
        
        content.add_widget(self.main_content_area)
        
        layout.add_widget(content)
        self.add_widget(layout)
    
    def show_surveillance(self):
        """Mostrar conteúdo de vigilância"""
        self.main_content_area.clear_widgets()
        self.main_content_area.add_widget(self.create_surveillance_content())
    
    def show_checklist(self):
        """Mostrar conteúdo de checklist"""
        self.main_content_area.clear_widgets()
        self.main_content_area.add_widget(self.create_checklist_content())
    
    def show_evacuation(self):
        """Mostrar conteúdo de evacuação"""
        self.main_content_area.clear_widgets()
        self.main_content_area.add_widget(self.create_evacuation_content())
    
    def create_surveillance_content(self):
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        title = MDLabel(text="Painel de Vigilância", font_style="H6")
        content.add_widget(title)
        
        # Simulação de câmeras
        cameras = [
            {"name": "Câmera 01 - Entrada Principal", "status": "Online"},
            {"name": "Câmera 02 - Pátio", "status": "Online"}, 
            {"name": "Câmera 03 - Corredor A", "status": "Offline"},
            {"name": "Câmera 04 - Biblioteca", "status": "Online"},
            {"name": "Câmera 05 - Quadra", "status": "Online"}
        ]
        
        for camera in cameras:
            camera_card = MDCard(
                size_hint=(1, None),
                height='60dp',
                padding=10
            )
            
            camera_layout = MDBoxLayout(spacing=10)
            
            # Ícone da câmera
            status_color = "green" if camera["status"] == "Online" else "red"
            camera_icon = MDIconButton(
                icon="cctv",
                theme_icon_color="Custom",
                icon_color=status_color,
                size_hint_x=None,
                width='40dp'
            )
            
            # Nome e status
            info_layout = MDBoxLayout(orientation='vertical', spacing=2)
            name_label = MDLabel(text=camera["name"], font_style="Body1")
            status_label = MDLabel(
                text=camera["status"], 
                font_style="Caption",
                theme_text_color="Custom",
                text_color=[0, 0.7, 0, 1] if camera["status"] == "Online" else [0.7, 0, 0, 1]
            )
            info_layout.add_widget(name_label)
            info_layout.add_widget(status_label)
            
            # Botão de visualizar
            view_btn = MDIconButton(
                icon="video-outline",
                theme_icon_color="Primary",
                size_hint_x=None,
                width='40dp',
                on_release=lambda x, cam=camera: self.view_camera(cam)
            )
            
            camera_layout.add_widget(camera_icon)
            camera_layout.add_widget(info_layout)
            camera_layout.add_widget(view_btn)
            
            camera_card.add_widget(camera_layout)
            content.add_widget(camera_card)
        
        return content
    
    def create_checklist_content(self):
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        title = MDLabel(text="Checklist de Segurança", font_style="H6")
        content.add_widget(title)
        
        checklist_items = [
            "Portas de emergência desbloqueadas",
            "Extintores carregados e acessíveis",
            "Iluminação de emergência funcionando",
            "Alarmes testados",
            "Rotas de evacuação sinalizadas",
            "Equipamentos de segurança funcionando"
        ]
        
        for item in checklist_items:
            item_layout = MDBoxLayout(size_hint_y=None, height='50dp')
            item_layout.add_widget(MDLabel(text=item, size_hint_x=0.7))
            
            checkbox = MDSwitch(size_hint_x=0.3)
            item_layout.add_widget(checkbox)
            
            content.add_widget(item_layout)
        
        if firebase_manager.has_permission('adicionar_ocorrencias'):
            save_btn = MDRaisedButton(
                text="SALVAR CHECKLIST",
                on_release=self.save_checklist
            )
            content.add_widget(save_btn)
        
        return content
    
    def create_evacuation_content(self):
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        title = MDLabel(text="Plano de Evacuação", font_style="H6")
        content.add_widget(title)
        
        instructions = [
            "🚨 EM CASO DE EMERGÊNCIA:",
            "",
            "1. Mantenha a calma",
            "2. Siga as rotas sinalizadas",
            "3. Não use elevadores",
            "4. Ajude quem precisar",
            "5. Dirija-se ao ponto de encontro",
            "",
            "📍 PONTO DE ENCONTRO:",
            "Quadra esportiva externa",
            "",
            "📞 CONTATOS DE EMERGÊNCIA:",
            "Bombeiros: 193",
            "Polícia: 190",
            "SAMU: 192",
            "Direção: (11) 99999-9999"
        ]
        
        for instruction in instructions:
            if instruction.startswith(("🚨", "📍", "📞")):
                label = MDLabel(text=instruction, font_style="Subtitle1", theme_text_color="Primary")
            elif instruction == "":
                label = MDLabel(text="", size_hint_y=None, height='10dp')
            else:
                label = MDLabel(text=instruction)
            
            content.add_widget(label)
        
        return content
    
    def view_camera(self, camera_info):
        self.show_dialog("Visualização", f"Abrindo {camera_info}")
    
    def save_checklist(self, *args):
        self.show_dialog("Sucesso", "Checklist salvo com sucesso!")
    
    def show_dialog(self, title, text):
        dialog = MDDialog(
            title=title,
            text=text,
            buttons=[MDFlatButton(text="OK", on_release=lambda x: dialog.dismiss())]
        )
        dialog.open()
    
    def go_back(self):
        self.manager.current = 'dashboard'


class SettingsScreen(MDScreen):
    """Tela de Configurações e Sistema de Banimento"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'settings'
        self.build_screen()
    
    def build_screen(self):
        layout = MDBoxLayout(orientation='vertical')
        
        toolbar = MDTopAppBar(
            title="Configurações",
            left_action_items=[["arrow-left", lambda x: self.go_back()]]
        )
        layout.add_widget(toolbar)
        
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        # Se for direção, mostrar sistema de banimento
        if firebase_manager.has_permission('banir_usuarios'):
            ban_system_card = MDCard(
                orientation='vertical',
                padding=20,
                spacing=10,
                size_hint=(1, None),
                height='300dp'
            )
            
            ban_title = MDLabel(text="Sistema de Banimento", font_style="H6")
            
            # Lista de usuários para banir/desbanir
            users_list = [
                {"name": "João Silva", "email": "joao@escola.com", "active": True},
                {"name": "Maria Santos", "email": "maria@escola.com", "active": False},
                {"name": "Pedro Lima", "email": "pedro@escola.com", "active": True}
            ]
            
            ban_system_card.add_widget(ban_title)
            
            for user in users_list:
                user_layout = MDBoxLayout(size_hint_y=None, height='40dp')
                
                status_text = "Ativo" if user["active"] else "BANIDO"
                status_color = "Primary" if user["active"] else "Error"
                
                user_info = f"{user['name']} - {status_text}"
                user_layout.add_widget(MDLabel(text=user_info, size_hint_x=0.6))
                
                action_text = "Banir" if user["active"] else "Reativar"
                action_color = "red" if user["active"] else "green"
                
                action_btn = MDRaisedButton(
                    text=action_text,
                    size_hint_x=0.4,
                    md_bg_color=action_color,
                    on_release=lambda x, u=user: self.toggle_user_ban(u)
                )
                user_layout.add_widget(action_btn)
                
                ban_system_card.add_widget(user_layout)
            
            content.add_widget(ban_system_card)
        
        # Configurações gerais
        general_settings_card = MDCard(
            orientation='vertical',
            padding=20,
            spacing=10,
            size_hint=(1, None),
            height='200dp'
        )
        
        settings_title = MDLabel(text="Configurações Gerais", font_style="H6")
        general_settings_card.add_widget(settings_title)
        
        # Notificações
        notif_layout = MDBoxLayout(size_hint_y=None, height='40dp')
        notif_layout.add_widget(MDLabel(text="Receber Notificações", size_hint_x=0.7))
        notif_switch = MDSwitch(size_hint_x=0.3, active=True)
        notif_layout.add_widget(notif_switch)
        general_settings_card.add_widget(notif_layout)
        
        # Modo escuro
        dark_layout = MDBoxLayout(size_hint_y=None, height='40dp')
        dark_layout.add_widget(MDLabel(text="Modo Escuro", size_hint_x=0.7))
        dark_switch = MDSwitch(size_hint_x=0.3)
        dark_layout.add_widget(dark_switch)
        general_settings_card.add_widget(dark_layout)
        
        content.add_widget(general_settings_card)
        layout.add_widget(content)
        self.add_widget(layout)
    
    def toggle_user_ban(self, user):
        action = "reativar" if not user["active"] else "banir"
        
        dialog = MDDialog(
            title="Confirmação",
            text=f"Você tem certeza que deseja {action} o usuário {user['name']}?",
            buttons=[
                MDFlatButton(text="CANCELAR", on_release=lambda x: dialog.dismiss()),
                MDFlatButton(
                    text="CONFIRMAR",
                    on_release=lambda x: self.confirm_user_ban(dialog, user, not user["active"])
                )
            ]
        )
        dialog.open()
    
    def confirm_user_ban(self, dialog, user, new_status):
        try:
            # Atualizar no Firebase
            if firebase_manager.db:
                # Buscar usuário pelo email e atualizar status
                users_ref = firebase_manager.db.collection('users').where('email', '==', user['email'])
                docs = users_ref.get()
                
                for doc in docs:
                    doc.reference.update({'active': new_status})
            
            user["active"] = new_status
            dialog.dismiss()
            
            action_text = "reativado" if new_status else "banido"
            self.show_dialog("Sucesso", f"Usuário {action_text} com sucesso!")
            
        except Exception as e:
            dialog.dismiss()
            self.show_dialog("Erro", f"Erro ao alterar status do usuário: {str(e)}")
    
    def show_dialog(self, title, text):
        dialog = MDDialog(
            title=title,
            text=text,
            buttons=[MDFlatButton(text="OK", on_release=lambda x: dialog.dismiss())]
        )
        dialog.open()
    
    def go_back(self):
        self.manager.current = 'dashboard'


class DrillsScreen(MDScreen):
    """Tela de Calendário de Simulados"""
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.name = 'drills'
        self.build_screen()
    
    def build_screen(self):
        layout = MDBoxLayout(orientation='vertical')
        
        toolbar = MDTopAppBar(
            title="Calendário de Simulados",
            left_action_items=[["arrow-left", lambda x: self.go_back()]]
        )
        layout.add_widget(toolbar)
        
        content = MDBoxLayout(orientation='vertical', padding=20, spacing=15)
        
        # Se for direção, mostrar formulário para criar simulado
        if firebase_manager.has_permission('cadastrar_campanhas'):  # Direção pode criar simulados
            create_drill_card = MDCard(
                orientation='vertical',
                padding=20,
                spacing=10,
                size_hint=(1, None),
                height='350dp'
            )
            
            form_title = MDLabel(text="Agendar Novo Simulado", font_style="H6")
            
            self.drill_type = MDTextField(hint_text="Tipo de simulado (incêndio, evacuação, terremoto)")
            self.drill_date = MDTextField(hint_text="Data (DD/MM/AAAA)")
            self.drill_time = MDTextField(hint_text="Horário (HH:MM)")
            self.drill_location = MDTextField(hint_text="Local/Setor")
            self.drill_description = MDTextField(
                hint_text="Instruções e observações",
                multiline=True
            )
            
            create_btn = MDRaisedButton(
                text="AGENDAR SIMULADO",
                on_release=self.create_drill
            )
            
            create_drill_card.add_widget(form_title)
            create_drill_card.add_widget(self.drill_type)
            create_drill_card.add_widget(self.drill_date)
            create_drill_card.add_widget(self.drill_time)
            create_drill_card.add_widget(self.drill_location)
            create_drill_card.add_widget(self.drill_description)
            create_drill_card.add_widget(create_btn)
            
            content.add_widget(create_drill_card)
        
        # Calendário de simulados agendados
        calendar_card = MDCard(
            orientation='vertical',
            padding=15,
            spacing=10,
            size_hint=(1, None),
            height='300dp'
        )
        
        calendar_title = MDLabel(text="Simulados Agendados", font_style="H6")
        calendar_card.add_widget(calendar_title)
        
        # Simulados de exemplo
        sample_drills = [
            {"type": "Simulado de Incêndio", "date": "25/09/2025 às 10:00", "location": "Todo colégio", "icon": "fire"},
            {"type": "Simulado de Terremoto", "date": "02/10/2025 às 14:30", "location": "Prédio A", "icon": "earth"},
            {"type": "Evacuação Geral", "date": "15/10/2025 às 09:15", "location": "Todas as unidades", "icon": "exit-run"},
            {"type": "Simulado Elétrico", "date": "20/10/2025 às 16:00", "location": "Laboratórios", "icon": "flash"}
        ]
        
        for drill in sample_drills:
            drill_card = MDCard(
                size_hint=(1, None),
                height='80dp',
                padding=10,
                spacing=10
            )
            
            drill_layout = MDBoxLayout(spacing=10)
            
            # Ícone do tipo de simulado
            drill_icon = MDIconButton(
                icon=drill["icon"],
                theme_icon_color="Primary",
                size_hint_x=None,
                width='40dp'
            )
            
            # Informações do simulado
            info_layout = MDBoxLayout(orientation='vertical', spacing=2)
            type_label = MDLabel(text=drill["type"], font_style="Body1")
            date_label = MDLabel(text=f'{drill["date"]} - {drill["location"]}', font_style="Caption")
            info_layout.add_widget(type_label)
            info_layout.add_widget(date_label)
            
            drill_layout.add_widget(drill_icon)
            drill_layout.add_widget(info_layout)
            
            # Botão de editar (se tiver permissão)
            if firebase_manager.has_permission('cadastrar_campanhas'):
                edit_btn = MDIconButton(
                    icon="pencil",
                    theme_icon_color="Custom",
                    icon_color="blue",
                    size_hint_x=None,
                    width='40dp',
                    on_release=lambda x, d=drill: self.edit_drill(d)
                )
                drill_layout.add_widget(edit_btn)
            
            drill_card.add_widget(drill_layout)
            calendar_card.add_widget(drill_card)
        
        content.add_widget(calendar_card)
        layout.add_widget(content)
        self.add_widget(layout)
    
    def create_drill(self, *args):
        drill_type = self.drill_type.text.strip()
        date = self.drill_date.text.strip()
        time = self.drill_time.text.strip()
        location = self.drill_location.text.strip()
        description = self.drill_description.text.strip()
        
        if not all([drill_type, date, time, location]):
            self.show_dialog("Erro", "Preencha todos os campos obrigatórios")
            return
        
        user = firebase_manager.get_current_user()
        
        drill_data = {
            'type': drill_type,
            'date': date,
            'time': time,
            'location': location,
            'description': description,
            'created_by': user.get('name', 'Direção') if user else 'Direção',
            'created_at': datetime.now().isoformat(),
            'status': 'scheduled'
        }
        
        try:
            if firebase_manager.db:
                firebase_manager.db.collection('drills').add(drill_data)
            
            # Limpar campos
            self.drill_type.text = ""
            self.drill_date.text = ""
            self.drill_time.text = ""
            self.drill_location.text = ""
            self.drill_description.text = ""
            
            self.show_dialog("Sucesso", "Simulado agendado com sucesso!")
            
        except Exception as e:
            self.show_dialog("Erro", f"Erro ao agendar simulado: {str(e)}")
    
    def edit_drill(self, drill_info):
        self.show_dialog("Editar", f"Editando: {drill_info}")
    
    def show_dialog(self, title, text):
        dialog = MDDialog(
            title=title,
            text=text,
            buttons=[MDFlatButton(text="OK", on_release=lambda x: dialog.dismiss())]
        )
        dialog.open()
    
    def go_back(self):
        self.manager.current = 'dashboard'


class SchoolSecurityApp(MDApp):
    """Aplicativo Principal"""
    
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
        sm.add_widget(IncidentsScreen())
        sm.add_widget(CampaignsScreen())
        sm.add_widget(DrillsScreen())
        sm.add_widget(SecurityScreen())
        sm.add_widget(SettingsScreen())
        
        return sm


if __name__ == '__main__':
    # Só executar se Kivy estiver disponível e RUN_KIVY=1
    if KIVY_AVAILABLE and os.getenv('RUN_KIVY') == '1':
        SchoolSecurityApp().run()
    else:
        print("Sistema de Segurança Escolar - Versão Desktop")
        print("Para executar a interface gráfica:")
        print("  1. Instale as dependências: pip install kivy kivymd firebase-admin pyrebase4")
        print("  2. Execute com: RUN_KIVY=1 python main.py")
        print("Ou use: python terminal_app.py para versão terminal")