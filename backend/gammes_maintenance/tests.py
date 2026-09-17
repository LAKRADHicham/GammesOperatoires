from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Equipement, GammeOperatoire, GammeVersion

class BackendSmokeTests(APITestCase):
    def setUp(self):
        self.user=User.objects.create_user('admin',password='Pass12345!')
        self.user.profile.role='admin'; self.user.profile.save()
        token=str(RefreshToken.for_user(self.user).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    def test_create_equipement(self):
        r=self.client.post('/api/equipements/',{'code':'EQ-01','nom':'Convoyeur'},format='json')
        self.assertEqual(r.status_code,201)
    def test_create_gamme_creates_v0(self):
        eq=Equipement.objects.create(code='EQ-01',nom='Convoyeur')
        r=self.client.post('/api/gammes/',{'code':'G-001','designation':'Maintenance convoyeur','equipement':str(eq.id)},format='json')
        self.assertEqual(r.status_code,201)
        g=GammeOperatoire.objects.get(code='G-001')
        self.assertTrue(GammeVersion.objects.filter(gamme=g,numero_version=0).exists())
