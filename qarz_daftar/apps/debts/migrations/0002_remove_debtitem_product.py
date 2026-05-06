from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('debts', '0001_initial'),
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='debtitem',
            name='product',
        ),
    ]
