from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    res = client.get('/activities')
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert 'Chess Club' in data


def test_signup_and_unregister():
    activity = 'Tennis Club'
    email = 'integration_test_user@example.com'

    # Ensure clean start
    if email in activities[activity]['participants']:
        activities[activity]['participants'].remove(email)

    # Sign up
    r = client.post(f"/activities/{activity}/signup?email={email}")
    assert r.status_code == 200
    assert email in activities[activity]['participants']

    # Unregister
    r2 = client.delete(f"/activities/{activity}/signup?email={email}")
    assert r2.status_code == 200
    assert email not in activities[activity]['participants']
