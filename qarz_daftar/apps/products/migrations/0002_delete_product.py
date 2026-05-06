from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
        ('debts', '0002_remove_debtitem_product'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Product',
        ),
    ]
